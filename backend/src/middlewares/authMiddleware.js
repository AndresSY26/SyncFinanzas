import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me';
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Falta el token de autenticación o el formato es inválido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // VALIDACIÓN ESTRICTA: ¿El token (sesión) sigue activo en la DB?
    const hashedToken = hashToken(token);
    const sessionCheck = await pool.query(
      'SELECT id FROM sessions WHERE token_hash = $1 AND activa = true',
      [hashedToken]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(401).json({ error: 'Sesión revocada o finalizada por el usuario.' });
    }

    req.user = decoded; // { userId: ... }
    req.token = token;  // Guardamos el token para poder invalidarlo luego si es necesario
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};
