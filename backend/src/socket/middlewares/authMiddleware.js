import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me';

export const authMiddleware = (socket, next) => {
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
