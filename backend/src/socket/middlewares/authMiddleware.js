import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me';
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const authMiddleware = async (socket, next) => {
  // Extraemos el Token enviado por el cliente en el handshake
  const token = socket.handshake.auth?.token;

  if (!token) {
    console.log(`❌ Conexión rechazada: Falta Token JWT (Socket: ${socket.id})`);
    const err = new Error("No autorizado: Falta Token de Sesión");
    err.data = { code: "UNAUTHORIZED" };
    return next(err);
  }

  try {
    // Validar y decodificar el token usando la misma llave secreta
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // VALIDACIÓN ESTRICTA: ¿El token (sesión) sigue activo en la DB?
    const hashedToken = hashToken(token);
    const sessionCheck = await pool.query(
      'SELECT id FROM sessions WHERE token_hash = $1 AND activa = true',
      [hashedToken]
    );

    if (sessionCheck.rows.length === 0) {
      console.log(`❌ Conexión WS rechazada: Sesión Zombi revocada (Socket: ${socket.id})`);
      const err = new Error("No autorizado: Sesión finalizada o revocada");
      err.data = { code: "UNAUTHORIZED" };
      return next(err);
    }

    // Si es válido, extraemos el userId y lo adjuntamos al socket de forma segura
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    console.log(`❌ Conexión rechazada: Token Inválido o Expirado (Socket: ${socket.id})`);
    const err = new Error("No autorizado: Token inválido");
    err.data = { code: "UNAUTHORIZED" };
    return next(err);
  }
};
