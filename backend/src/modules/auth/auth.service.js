import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
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

  if (user.is_2fa_enabled) {
    return { requiere_2fa: true, userId: user.id };
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
    const randomPassword = crypto.randomBytes(16).toString('hex'); 
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

export const updateProfile = async (userId, { nombre_completo, username }) => {
  // Opcionalmente validar si username ya está tomado por otro (si se cambió)
  const userExists = await pool.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, userId]);
  if (userExists.rows.length > 0) {
    throw new CustomError('El nombre de usuario ya está registrado por otra persona', 400);
  }

  const query = `
    UPDATE users 
    SET nombre_completo = COALESCE($1, nombre_completo), 
        username = COALESCE($2, username)
    WHERE id = $3
    RETURNING id, nombre_completo, username, email;
  `;
  const result = await pool.query(query, [nombre_completo, username, userId]);
  if (result.rows.length === 0) {
    throw new CustomError('Usuario no encontrado', 404);
  }
  return { user: result.rows[0], message: 'Perfil actualizado exitosamente' };
};

export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0) {
    throw new CustomError('Usuario no encontrado', 404);
  }
  const user = result.rows[0];

  const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValidPassword) {
    throw new CustomError('La contraseña actual es incorrecta', 401);
  }

  const saltRounds = 10;
  const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, userId]);
  
  return { message: 'Contraseña actualizada exitosamente' };
};

export const generate2FA = async (userId) => {
  const result = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0) throw new CustomError('Usuario no encontrado', 404);
  const email = result.rows[0].email;

  const secret = authenticator.generateSecret();
  await pool.query('UPDATE users SET totp_secret = $1 WHERE id = $2', [secret, userId]);

  const otpauth = authenticator.keyuri(email, 'SyncFinanzas', secret);
  const qrCodeUrl = await QRCode.toDataURL(otpauth);

  return { secret, qrCodeUrl };
};

export const enable2FA = async (userId, token) => {
  const result = await pool.query('SELECT totp_secret FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0) throw new CustomError('Usuario no encontrado', 404);
  const secret = result.rows[0].totp_secret;

  if (!secret) throw new CustomError('El secreto 2FA no ha sido generado', 400);

  const isValid = authenticator.check(token, secret);
  if (!isValid) throw new CustomError('El código 2FA es inválido', 401);

  await pool.query('UPDATE users SET is_2fa_enabled = true WHERE id = $1', [userId]);
  return { message: '2FA activado correctamente' };
};

export const verifyLogin2FA = async (userId, token, meta) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0) {
    throw new CustomError('Credenciales inválidas', 401);
  }
  const user = result.rows[0];

  if (user.is_social_login && !user.password_hash) {
    throw new CustomError('Este usuario fue registrado con Google. Inicia sesión con Google.', 401);
  }

  const isValid = authenticator.check(token, user.totp_secret);
  if (!isValid) throw new CustomError('Código 2FA incorrecto', 401);

  delete user.password_hash;
  delete user.totp_secret;

  const jwtToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

  let locationToSave = meta.ip;
  if (meta.ip === '::1' || meta.ip === '127.0.0.1' || meta.ip.includes('::ffff:127.0.0.1')) {
    locationToSave = 'Bogotá, Colombia';
  } else {
    try {
      const response = await fetch(`https://ip-api.com/json/${meta.ip}`);
      const data = await response.json();
      if (data.status === 'success') {
        locationToSave = `${data.city}, ${data.country}`;
      }
    } catch (e) {
      console.warn('No se pudo geolocalizar la IP');
    }
  }

  // Hashear y registrar la sesión
  const tokenHash = hashToken(jwtToken);

  await pool.query(
    'INSERT INTO sessions (usuario_id, dispositivo, ip_origen, token_hash) VALUES ($1, $2, $3, $4)',
    [user.id, meta.userAgent, locationToSave, tokenHash]
  );

  return { user, token: jwtToken };
};
