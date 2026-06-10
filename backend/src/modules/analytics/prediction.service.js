import pool from '../../config/database.js';

export const predictionService = {
  // Función auxiliar para Regresión Lineal (Mínimos Cuadrados)
  calculateLinearRegression: (points) => {
    // points es un array de {x: día, y: monto}
    const n = points.length;
    if (n === 0) return { m: 0, b: 0 };
    if (n === 1) return { m: 0, b: points[0].y };

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    points.forEach(p => {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumX2 += p.x * p.x;
    });

    const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const b = (sumY - m * sumX) / n;
    
    return { m, b };
  },

  getProjection: async (usuario_id) => {
    try {
      // 1. Obtener transacciones de los últimos 90 días
      const query = `
        SELECT fecha, tipo, monto 
        FROM transactions 
        WHERE usuario_id = $1 AND fecha >= CURRENT_DATE - INTERVAL '90 days'
        ORDER BY fecha ASC;
      `;
      const result = await pool.query(query, [usuario_id]);
      const txs = result.rows;

      if (txs.length === 0) {
        return {
          predictions: {
            income: { slope: 0, intercept: 0, projectedPoints: [] },
            expense: { slope: 0, intercept: 0, projectedPoints: [] }
          },
          insights: null
        };
      }

      // 2. Agrupar por días relativos (x = 0 es el día más antiguo, x = N es hoy)
      const startDate = new Date(txs[0].fecha);
      const pointsIncomeMap = {};
      const pointsExpenseMap = {};

      const today = new Date();
      // Asegurar que hoy es el max X
      const maxDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

      txs.forEach(tx => {
        const txDate = new Date(tx.fecha);
        const dayIndex = Math.floor((txDate - startDate) / (1000 * 60 * 60 * 24));
        const monto = parseFloat(tx.monto);

        if (tx.tipo === 'income') {
          pointsIncomeMap[dayIndex] = (pointsIncomeMap[dayIndex] || 0) + monto;
        } else if (tx.tipo === 'expense') {
          pointsExpenseMap[dayIndex] = (pointsExpenseMap[dayIndex] || 0) + monto;
        }
      });

      // Crear arreglos de puntos densos o dispersos
      const incomePoints = Object.keys(pointsIncomeMap).map(k => ({ x: parseInt(k), y: pointsIncomeMap[k] }));
      const expensePoints = Object.keys(pointsExpenseMap).map(k => ({ x: parseInt(k), y: pointsExpenseMap[k] }));

      // 3. Calcular Regresión Lineal
      const incReg = predictionService.calculateLinearRegression(incomePoints);
      const expReg = predictionService.calculateLinearRegression(expensePoints);

      // 4. Proyectar a +15 y +30 días desde hoy
      const future15X = maxDays + 15;
      const future30X = maxDays + 30;

      // Fechas proyectadas
      const date15 = new Date(today); date15.setDate(date15.getDate() + 15);
      const date30 = new Date(today); date30.setDate(date30.getDate() + 30);

      const formatShortDate = (d) => d.toISOString().split('T')[0];

      // Proyectamos para ingresos
      const incProj15 = incReg.m * future15X + incReg.b;
      const incProj30 = incReg.m * future30X + incReg.b;
      
      // Proyectamos para gastos
      const expProj15 = expReg.m * future15X + expReg.b;
      const expProj30 = expReg.m * future30X + expReg.b;

      const predictions = {
        income: {
          slope: incReg.m,
          intercept: incReg.b,
          projectedPoints: [
            { date: formatShortDate(date15), amount: Math.max(0, incProj15) },
            { date: formatShortDate(date30), amount: Math.max(0, incProj30) }
          ]
        },
        expense: {
          slope: expReg.m,
          intercept: expReg.b,
          projectedPoints: [
            { date: formatShortDate(date15), amount: Math.max(0, expProj15) },
            { date: formatShortDate(date30), amount: Math.max(0, expProj30) }
          ]
        }
      };

      // 5. Analítica Temprana de Presupuestos
      const insights = await predictionService.checkBudgetRisks(usuario_id);

      return { predictions, insights };
    } catch (error) {
      console.error('Error en getProjection:', error.message);
      return { predictions: null, insights: null };
    }
  },

  checkBudgetRisks: async (usuario_id) => {
    try {
      const budgetQuery = `
        SELECT b.*, 
               (SELECT COALESCE(SUM(monto), 0) FROM transactions t 
                WHERE t.usuario_id = b.usuario_id AND t.categoria = b.categoria 
                AND t.tipo = 'expense' AND t.fecha BETWEEN b.fecha_inicio AND b.fecha_fin) as gastado
        FROM budgets b
        WHERE b.usuario_id = $1 AND b.fecha_fin >= CURRENT_DATE AND b.fecha_inicio <= CURRENT_DATE
      `;
      const result = await pool.query(budgetQuery, [usuario_id]);
      const budgets = result.rows;

      const today = new Date();
      let alertMsg = null;

      for (const b of budgets) {
        const inicio = new Date(b.fecha_inicio);
        const fin = new Date(b.fecha_fin);
        
        const daysPassed = Math.max(1, Math.floor((today - inicio) / (1000 * 60 * 60 * 24)));
        const totalDays = Math.max(1, Math.floor((fin - inicio) / (1000 * 60 * 60 * 24)));
        const daysRemaining = totalDays - daysPassed;
        
        const gastado = parseFloat(b.gastado);
        const limite = parseFloat(b.monto_limite);
        
        // Ritmo de gasto por día
        const dailyRate = gastado / daysPassed;
        const predictedTotal = gastado + (dailyRate * daysRemaining);

        if (predictedTotal > limite && daysRemaining > 0 && gastado < limite) {
          // Si el proyectado rompe el límite y aún tenemos margen de días y no lo hemos roto aún
          const diasParaRomper = Math.max(1, Math.floor((limite - gastado) / dailyRate));
          alertMsg = `Basado en tu ritmo de gasto actual, superarás el presupuesto de ${b.categoria} en aprox. ${diasParaRomper} días.`;
          break; // Devolvemos el primer riesgo inminente encontrado
        }
      }

      return alertMsg;
    } catch (error) {
      console.error('Error en checkBudgetRisks:', error.message);
      return null;
    }
  }
};
