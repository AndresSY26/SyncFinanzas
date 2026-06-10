import nodemailer from 'nodemailer';
import pool from '../../config/database.js';
import { appEvents } from '../../utils/eventEmitter.js';
import { budgetService } from '../budgets/budget.service.js';
import { goalService } from '../goals/goal.service.js';

export const emailNotificationService = {
  transporter: null,

  init: () => {
    try {
      emailNotificationService.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      console.log('✅ Servicio SMTP (Nodemailer) inicializado.');
    } catch (error) {
      console.error('Error inicializando SMTP:', error);
    }
  },

  sendEmail: async (to, subject, htmlBody) => {
    if (!emailNotificationService.transporter) {
      console.warn('⚠️ SMTP no configurado. Ignorando envío de correo.');
      return;
    }
    try {
      await emailNotificationService.transporter.sendMail({
        from: `"SyncFinanzas Alertas" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: htmlBody,
      });
    } catch (error) {
      console.error('Error enviando correo SMTP:', error);
    }
  },

  getUserEmail: async (usuario_id) => {
    try {
      const result = await pool.query('SELECT email FROM users WHERE id = $1', [usuario_id]);
      if (result.rows.length > 0) return result.rows[0].email;
      return null;
    } catch (error) {
      console.error('Error obteniendo email de usuario:', error);
      return null;
    }
  },

  setupListeners: () => {
    // Escuchar GASTOS para validar Presupuestos rotos
    appEvents.on('transaction:expense', async (tx) => {
      try {
        const budgets = await budgetService.listBudgets(tx.usuario_id);
        const categoryBudget = budgets.find(b => b.categoria === tx.categoria);
        
        if (categoryBudget) {
          // Si el gasto acumulado (+ este último tx) supera el límite
          const totalGastado = parseFloat(categoryBudget.gastado);
          const limite = parseFloat(categoryBudget.monto_limite);
          
          if (totalGastado > limite) {
            const email = await emailNotificationService.getUserEmail(tx.usuario_id);
            if (!email) return;

            const html = `
              <!DOCTYPE html>
              <html lang="es">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta name="color-scheme" content="light dark">
                <meta name="supported-color-schemes" content="light dark">
                <style>
                  :root {
                    --bg-body: #f4f4f5;
                    --bg-card: #ffffff;
                    --text-main: #333333;
                    --text-muted: #666666;
                    --border-color: #e4e4e7;
                    --box-bg: #f8f9fa;
                    --divider: #eeeeee;
                    --shadow: rgba(0,0,0,0.05);
                  }
                  @media (prefers-color-scheme: dark) {
                    :root {
                      --bg-body: #000000;
                      --bg-card: #1a1a1a;
                      --text-main: #ffffff;
                      --text-muted: #cccccc;
                      --border-color: #333333;
                      --box-bg: #2a2a2a;
                      --divider: #444444;
                      --shadow: rgba(0,0,0,0.5);
                    }
                  }
                  body {
                    margin: 0;
                    padding: 40px 20px;
                    background-color: var(--bg-body);
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    color: var(--text-main);
                  }
                  .card {
                    background-color: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 40px;
                    box-shadow: 0 4px 15px var(--shadow);
                  }
                  .header {
                    text-align: center;
                    padding-bottom: 20px;
                    border-bottom: 1px solid var(--border-color);
                    margin-bottom: 30px;
                  }
                  .title {
                    color: #f72585;
                    margin: 0;
                    font-size: 28px;
                    letter-spacing: 1px;
                  }
                  .alert-title {
                    color: #ff4d4d;
                    font-size: 22px;
                    margin-top: 0;
                    text-align: center;
                  }
                  .text {
                    font-size: 16px;
                    line-height: 1.6;
                    color: var(--text-muted);
                  }
                  .data-box {
                    background-color: var(--box-bg);
                    border-left: 4px solid #ff4d4d;
                    padding: 20px;
                    margin: 30px 0;
                    border-radius: 0 8px 8px 0;
                  }
                  .data-table {
                    width: 100%;
                    font-size: 16px;
                  }
                  .data-table td {
                    padding-bottom: 10px;
                  }
                  .label {
                    color: var(--text-muted);
                  }
                  .value {
                    text-align: right;
                    font-weight: bold;
                    color: var(--text-main);
                  }
                  .value-red {
                    text-align: right;
                    font-weight: bold;
                    color: #ff4d4d;
                    font-size: 18px;
                  }
                  .hr {
                    border: 0;
                    border-top: 1px solid var(--divider);
                    margin: 10px 0;
                  }
                  .footer {
                    text-align: center;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid var(--border-color);
                  }
                  .btn {
                    background: linear-gradient(90deg, #f72585, #7209b7);
                    color: white;
                    text-decoration: none;
                    padding: 12px 30px;
                    border-radius: 25px;
                    font-weight: bold;
                    display: inline-block;
                    font-size: 16px;
                  }
                  .disclaimer {
                    color: var(--text-muted);
                    font-size: 12px;
                    margin-top: 20px;
                  }
                </style>
              </head>
              <body>
                <div class="card">
                  <div class="header">
                    <h1 class="title">SyncFinanzas <span style="font-size: 24px;">⚡</span></h1>
                  </div>
                  
                  <h2 class="alert-title">⚠️ Alerta Crítica de Presupuesto</h2>
                  
                  <p class="text">Hola,</p>
                  <p class="text">El sistema inteligente ha detectado que se acaba de registrar un gasto que supera tu límite establecido para este periodo.</p>
                  
                  <div class="data-box">
                    <table class="data-table" cellpadding="0" cellspacing="0">
                      <tr>
                        <td class="label"><strong>Categoría:</strong></td>
                        <td class="value">${tx.categoria}</td>
                      </tr>
                      <tr>
                        <td class="label"><strong>Límite establecido:</strong></td>
                        <td class="value">$${limite.toLocaleString('es-CO')}</td>
                      </tr>
                      <tr>
                        <td class="label"><strong>Último Gasto:</strong></td>
                        <td class="value">$${parseFloat(tx.monto).toLocaleString('es-CO')}</td>
                      </tr>
                      <tr><td colspan="2"><hr class="hr"></td></tr>
                      <tr>
                        <td class="label" style="padding-top: 5px;"><strong>Total Acumulado:</strong></td>
                        <td class="value-red" style="padding-top: 5px;">$${totalGastado.toLocaleString('es-CO')}</td>
                      </tr>
                    </table>
                  </div>
                  
                  <p class="text" style="text-align: center; margin-top: 30px; font-style: italic; font-size: 15px;">
                    Acción sugerida: Reasigna fondos o reduce gastos en esta categoría para evitar desbalances a final de mes.
                  </p>
                  
                  <div class="footer">
                    <a href="http://localhost:5173/dashboard" class="btn" style="color: #ffffff !important; text-decoration: none;">Ir a mi Dashboard</a>
                    <p class="disclaimer">Este es un correo automático, por favor no respondas a esta dirección.</p>
                  </div>
                </div>
              </body>
              </html>
            `;
            await emailNotificationService.sendEmail(email, '[SyncFinanzas] ⚠️ Alerta de Control: Límite de Presupuesto Superado', html);
          }
        }
      } catch (error) {
        console.error('Error procesando listener de gastos SMTP:', error);
      }
    });

    // Escuchar INGRESOS para validar Metas completadas
    appEvents.on('transaction:income', async (tx) => {
      try {
        const goals = await goalService.listGoals(tx.usuario_id);
        
        // Revisar si algún goal acaba de alcanzar su objetivo. 
        // Asumiendo que el goal.monto_actual (progreso_calculado) ya incluye el depósito porque la transacción ya fue insertada.
        for (const goal of goals) {
          if (goal.cuenta_id === tx.cuenta_id) {
            const actual = parseFloat(goal.monto_actual);
            const objetivo = parseFloat(goal.monto_objetivo);
            
            // Lógica para enviar si es mayor o igual al 100%
            // Idealmente se debería comprobar si "recién" se completó, pero esto sirve para notificar 
            if (actual >= objetivo) {
              const email = await emailNotificationService.getUserEmail(tx.usuario_id);
              if (!email) return;

              const html = `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <meta name="color-scheme" content="light dark">
                  <meta name="supported-color-schemes" content="light dark">
                  <style>
                    :root {
                      --bg-body: #f4f4f5;
                      --bg-card: #ffffff;
                      --text-main: #333333;
                      --text-muted: #666666;
                      --border-color: #e4e4e7;
                      --box-bg: #f8f9fa;
                      --divider: #eeeeee;
                      --shadow: rgba(0,0,0,0.05);
                    }
                    @media (prefers-color-scheme: dark) {
                      :root {
                        --bg-body: #000000;
                        --bg-card: #1a1a1a;
                        --text-main: #ffffff;
                        --text-muted: #cccccc;
                        --border-color: #333333;
                        --box-bg: #2a2a2a;
                        --divider: #444444;
                        --shadow: rgba(0,0,0,0.5);
                      }
                    }
                    body {
                      margin: 0;
                      padding: 40px 20px;
                      background-color: var(--bg-body);
                      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                      color: var(--text-main);
                    }
                    .card {
                      background-color: var(--bg-card);
                      border: 1px solid var(--border-color);
                      border-radius: 12px;
                      max-width: 600px;
                      margin: 0 auto;
                      padding: 40px;
                      box-shadow: 0 4px 15px var(--shadow);
                    }
                    .header {
                      text-align: center;
                      padding-bottom: 20px;
                      border-bottom: 1px solid var(--border-color);
                      margin-bottom: 30px;
                    }
                    .title {
                      color: #4cc9f0;
                      margin: 0;
                      font-size: 28px;
                      letter-spacing: 1px;
                    }
                    .alert-title {
                      color: #06d6a0;
                      font-size: 24px;
                      margin-top: 0;
                      text-align: center;
                    }
                    .text {
                      font-size: 16px;
                      line-height: 1.6;
                      color: var(--text-muted);
                      text-align: center;
                    }
                    .data-box {
                      background-color: var(--box-bg);
                      border-left: 4px solid #06d6a0;
                      padding: 25px;
                      margin: 30px 0;
                      border-radius: 0 8px 8px 0;
                      text-align: center;
                    }
                    .goal-title {
                      color: var(--text-main);
                      margin-top: 0;
                      font-size: 20px;
                    }
                    .stats-container {
                      margin: 20px 0;
                    }
                    .stat-label {
                      display: block;
                      color: var(--text-muted);
                      font-size: 14px;
                      margin-bottom: 5px;
                    }
                    .stat-value {
                      display: block;
                      color: #06d6a0;
                      font-size: 32px;
                      font-weight: bold;
                    }
                    .progress-bg {
                      background-color: var(--divider);
                      height: 10px;
                      border-radius: 5px;
                      width: 100%;
                      margin-top: 15px;
                      overflow: hidden;
                    }
                    .progress-fill {
                      background: linear-gradient(90deg, #4cc9f0, #06d6a0);
                      height: 100%;
                      width: 100%;
                    }
                    .footer {
                      text-align: center;
                      margin-top: 40px;
                      padding-top: 20px;
                      border-top: 1px solid var(--border-color);
                    }
                    .btn {
                      background: linear-gradient(90deg, #4cc9f0, #06d6a0);
                      color: #1a1a1a;
                      text-decoration: none;
                      padding: 12px 30px;
                      border-radius: 25px;
                      font-weight: bold;
                      display: inline-block;
                      font-size: 16px;
                    }
                    .disclaimer {
                      color: var(--text-muted);
                      font-size: 12px;
                      margin-top: 20px;
                    }
                  </style>
                </head>
                <body>
                  <div class="card">
                    <div class="header">
                      <h1 class="title">SyncFinanzas <span style="font-size: 24px;">⚡</span></h1>
                    </div>
                    
                    <h2 class="alert-title">🎉 ¡Meta Alcanzada!</h2>
                    
                    <p class="text">¡Excelentes noticias! Con tu último movimiento, has superado la línea de meta.</p>
                    
                    <div class="data-box">
                      <h3 class="goal-title">${goal.nombre}</h3>
                      
                      <div class="stats-container">
                        <span class="stat-label">Objetivo inicial: $${objetivo.toLocaleString('es-CO')}</span>
                        <span class="stat-value">$${actual.toLocaleString('es-CO')}</span>
                      </div>
                      
                      <div class="progress-bg">
                        <div class="progress-fill"></div>
                      </div>
                    </div>
                    
                    <p class="text" style="margin-top: 20px;">
                      La disciplina rinde frutos. ¡Sigue así construyendo tu libertad financiera!
                    </p>
                    
                    <div class="footer">
                      <a href="http://localhost:5173/dashboard" class="btn" style="color: #1a1a1a !important; text-decoration: none;">Ver mis metas</a>
                      <p class="disclaimer">Este es un correo automático, por favor no respondas a esta dirección.</p>
                    </div>
                  </div>
                </body>
                </html>
              `;
              await emailNotificationService.sendEmail(email, '[SyncFinanzas] 🎉 ¡Meta de Ahorro Alcanzada!', html);
            }
          }
        }
      } catch (error) {
        console.error('Error procesando listener de ingresos SMTP:', error);
      }
    });
  }
};
