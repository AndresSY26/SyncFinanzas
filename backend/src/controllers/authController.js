import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/index.js';

// Llave secreta para firmar los tokens (En producción debe estar en .env)
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me';

export const registerUser = async (req, res) => {
  try {
    const { nombre_completo, username, email, password } = req.body;

    // Verificar si el usuario o email ya existe
    const userExists = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'El email o username ya está registrado' });
    }

    // Hashear la contraseña con bcrypt (10 rondas de salt)
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insertar en Base de Datos
    const query = `
      INSERT INTO users (nombre_completo, username, email, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, nombre_completo, username, email;
    `;
    const values = [nombre_completo, username, email, password_hash];
    const result = await pool.query(query, values);
    const user = result.rows[0];

    // Generar JSON Web Token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ error: 'Error interno del servidor al registrar usuario' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario por email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas (Correo no encontrado)' });
    }
    const user = result.rows[0];

    // Verificar contraseña encriptada
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas (Contraseña incorrecta)' });
    }

    // Generar JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    // Excluir el hash de la contraseña de la respuesta por seguridad
    delete user.password_hash;
    
    // Registrar la sesión en la base de datos
    const dispositivo = req.headers['user-agent'] || 'Desconocido';
    let ip = req.ip || req.connection.remoteAddress || 'Desconocida';
    let locationToSave = ip;

    if (ip === '::1' || ip === '127.0.0.1' || ip.includes('::ffff:127.0.0.1')) {
      locationToSave = 'Bogotá, Colombia';
    } else {
      try {
        const response = await fetch(`http://ip-api.com/json/${ip}`);
        const data = await response.json();
        if (data.status === 'success') {
          locationToSave = `${data.city}, ${data.country}`;
        }
      } catch (e) {
        console.warn('No se pudo geolocalizar la IP');
      }
    }

    await pool.query(
      'INSERT INTO sessions (usuario_id, dispositivo, ip_origen, token_hash) VALUES ($1, $2, $3, $4)',
      [user.id, dispositivo, locationToSave, token]
    );

    res.json({ user, token });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor al iniciar sesión' });
  }
};

export const getSessions = async (req, res) => {
  try {
    const { userId } = req.user;
    const result = await pool.query(
      'SELECT id, dispositivo, ip_origen, activa, ultima_conexion, token_hash FROM sessions WHERE usuario_id = $1 ORDER BY ultima_conexion DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error en getSessions:', error);
    res.status(500).json({ error: 'Error al obtener las sesiones' });
  }
};

export const revokeSession = async (req, res) => {
  try {
    const { userId } = req.user;
    const { sessionId } = req.body;
    
    await pool.query(
      'UPDATE sessions SET activa = false WHERE id = $1 AND usuario_id = $2',
      [sessionId, userId]
    );
    res.json({ message: 'Sesión revocada exitosamente' });
  } catch (error) {
    console.error('Error en revokeSession:', error);
    res.status(500).json({ error: 'Error al revocar la sesión' });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const { token } = req;
    
    await pool.query(
      'UPDATE sessions SET activa = false WHERE token_hash = $1',
      [token]
    );
    res.json({ message: 'Sesión cerrada exitosamente' });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
};
