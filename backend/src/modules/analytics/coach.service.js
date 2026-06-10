import { GoogleGenerativeAI } from '@google/generative-ai';
import { budgetService } from '../budgets/budget.service.js';
import { goalService } from '../goals/goal.service.js';
import { predictionService } from './prediction.service.js';

export const coachService = {
  getInsight: async (usuario_id) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return {
          alerta_critica: "No se ha detectado la API Key de Gemini en el servidor.",
          accion_inmediata: "Configura la variable GEMINI_API_KEY en tu archivo .env",
          estrategia_ahorro: "El Smart Coach estará desactivado hasta que agregues la clave."
        };
      }

      // 1. Recopilar contexto financiero
      const budgets = await budgetService.listBudgets(usuario_id);
      const goals = await goalService.listGoals(usuario_id);
      const predictions = await predictionService.getProjection(usuario_id);

      // Formatear el contexto para la IA
      const contextData = {
        budgets: budgets.map(b => ({
          categoria: b.categoria,
          limite: b.monto_limite,
          gastado: b.gastado,
          fecha_fin: b.fecha_fin,
          dias_restantes: Math.max(0, Math.ceil((new Date(b.fecha_fin) - new Date()) / (1000 * 60 * 60 * 24)))
        })),
        savings_goals: goals.map(g => ({
          nombre: g.nombre,
          objetivo: g.monto_objetivo,
          actual: g.monto_actual
        })),
        predictions: {
          insight_lineal: predictions.insights || "El ritmo de gasto actual es estable.",
          pendiente_gastos: predictions.predictions?.expense?.slope || 0,
          pendiente_ingresos: predictions.predictions?.income?.slope || 0
        }
      };

      // 2. Construir Prompt del Sistema
      const prompt = `
Eres el "Smart Coach", un asesor financiero Senior de inteligencia artificial de la app SyncFinanzas.
Analiza la siguiente "foto financiera" en tiempo real del usuario:
${JSON.stringify(contextData)}

Actúa de forma proactiva, concisa y muy directa. No uses saludos formales. 
Tu única misión es evaluar riesgos (presupuestos por romperse), sugerir movimientos inteligentes (ej: mover dinero de una cuenta a otra) y alentar el cumplimiento de metas basado en la proyección de la regresión lineal.

DEBES responder ESTRICTAMENTE y ÚNICAMENTE en formato JSON con la siguiente estructura exacta, sin markdown de bloques de código (\`\`\`) ni texto adicional fuera del JSON:
{
  "alerta_critica": "string breve de 15 palabras max evaluando el mayor riesgo",
  "accion_inmediata": "string breve sugiriendo una accion clara y concisa",
  "estrategia_ahorro": "string motivacional con un insight para llegar a una de las metas"
}`;

      // 3. Llamar a la API de Google Gemini
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      const result = await model.generateContent(prompt);
      const textResponse = result.response.text();
      
      // 4. Parsear JSON estricto
      let cleanText = textResponse.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```/g, '').trim();
      }

      return JSON.parse(cleanText);

    } catch (error) {
      console.error('Error en Smart Coach Service:', error);
      return {
        alerta_critica: "Servicio temporalmente inactivo.",
        accion_inmediata: "Hubo un error procesando tus insights con la IA.",
        estrategia_ahorro: "Inténtalo más tarde."
      };
    }
  }
};
