import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import pool from '../../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Error personalizado para estructurar respuestas HTTP desde el servicio
export class CustomError extends Error {
  constructor(message, statusCode, extraData = {}) {
    super(message);
    this.statusCode = statusCode;
    this.extraData = extraData;
  }
}

export const register = async ({ nombre_completo, username, email, password }) => {
  const userExists = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
  if (userExists.rows.length > 0) {
    throw new CustomError('El email o username ya está registrado', 400);
  }

  const saltRounds = 10;
  const password_hash = await bcrypt.hash(password, saltRounds);

  const query = `
    INSERT INTO users (nombre_completo, username, email, password_hash)
    VALUES ($1, $2, $3, $4)
    RETURNING id, nombre_completo, username, email;
  `;
  const result = await pool.query(query, [nombre_completo, username, email, password_hash]);
  const user = result.rows[0];

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  return { user, token };
};

export const login = async ({ email, password }, reqMeta) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    throw new CustomError('Credenciales inválidas (Correo no encontrado)', 401);
  }
  const user = result.rows[0];

  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new CustomError('Credenciales inválidas (Contraseña incorrecta)', 401);
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  delete user.password_hash;

  let locationToSave = reqMeta.ip;
  if (reqMeta.ip === '::1' || reqMeta.ip === '127.0.0.1' || reqMeta.ip.includes('::ffff:127.0.0.1')) {
    locationToSave = 'Bogotá, Colombia';
  } else {
    try {
      const response = await fetch(`https://ip-api.com/json/${reqMeta.ip}`);
      const data = await response.json();
      if (data.status === 'success') {
        locationToSave = `${data.city}, ${data.country}`;
      }
    } catch (e) {
      console.warn('No se pudo geolocalizar la IP');
    }
  }

  const hashedToken = hashToken(token);

  await pool.query(
    'INSERT INTO sessions (usuario_id, dispositivo, ip_origen, token_hash) VALUES ($1, $2, $3, $4)',
    [user.id, reqMeta.userAgent, locationToSave, hashedToken]
  );

  return { user, token };
};

export const getUserSessions = async (userId) => {
  const result = await pool.query(
    'SELECT id, dispositivo, ip_origen, activa, ultima_conexion, token_hash FROM sessions WHERE usuario_id = $1 ORDER BY ultima_conexion DESC',
    [userId]
  );
  return result.rows;
};

export const revokeSessionById = async (sessionId, userId) => {
  await pool.query(
    'UPDATE sessions SET activa = false WHERE id = $1 AND usuario_id = $2',
    [sessionId, userId]
  );
};

export const logoutSession = async (token) => {
  const hashedToken = hashToken(token);
  await pool.query(
    'UPDATE sessions SET activa = false WHERE token_hash = $1',
    [hashedToken]
  );
};

export const googleAuthFlow = async ({ idToken }, reqMeta) => {
  if (!idToken) {
    throw new CustomError('Token de Google no proporcionado', 400);
  }

  // 1. Verificar Token Real de Google
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const { email, name } = payload;

  if (!email) {
    throw new CustomError('El token de Google no contiene un email válido', 400);
  }

  // 2. Buscar si el usuario ya existe
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  let user;

  if (result.rows.length === 0) {
    // Caso A: Registro Automático
    const username = email.split('@')[0] + Math.floor(Math.random() * 10000);
    const randomPassword = Math.random().toString(36).slice(-10) + 'A1!'; 
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(randomPassword, saltRounds);

    const query = `
      INSERT INTO users (nombre_completo, username, email, password_hash, is_social_login)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nombre_completo, username, email, is_social_login;
    `;
    const insertResult = await pool.query(query, [name || 'Usuario Google', username, email, password_hash, true]);
    user = insertResult.rows[0];
  } else {
    // Caso B: Login de Usuario Existente
    user = result.rows[0];
    delete user.password_hash;
  }

  // 3. Generar Sesión Nativa de SyncFinanzas
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

  let locationToSave = reqMeta.ip;
  if (reqMeta.ip === '::1' || reqMeta.ip === '127.0.0.1' || reqMeta.ip.includes('::ffff:127.0.0.1')) {
    locationToSave = 'Bogotá, Colombia';
  } else {
    try {
      const response = await fetch(`https://ip-api.com/json/${reqMeta.ip}`);
      const data = await response.json();
      if (data.status === 'success') {
        locationToSave = `${data.city}, ${data.country}`;
      }
    } catch (e) {
      console.warn('No se pudo geolocalizar la IP');
    }
  }

  const hashedToken = hashToken(token);

  await pool.query(
    'INSERT INTO sessions (usuario_id, dispositivo, ip_origen, token_hash) VALUES ($1, $2, $3, $4)',
    [user.id, reqMeta.userAgent, locationToSave, hashedToken]
  );

  return { user, token };
};
