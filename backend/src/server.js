import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './db/index.js';
import { initDB } from './db/init.js';
import { setupSockets } from './socket/index.js';
import authRoutes from './routes/authRoutes.js';

// Cargar variables de entorno
dotenv.config();

const PORT = process.env.PORT || 3000;

// Inicializar la aplicación Express
const app = express();

// Configurar middlewares HTTP básicos
app.use(cors());
app.use(express.json());

// Mapear rutas HTTP RESTful
app.use('/api/auth', authRoutes);

// Crear el servidor HTTP base
const server = http.createServer(app);

// Inicializar el servidor de WebSockets (Socket.io) adjunto al servidor HTTP
const io = new Server(server, {
  cors: {
    origin: '*', // En desarrollo permitimos cualquier origen
    methods: ['GET', 'POST']
  }
});

// Delegar la lógica y orquestación de sockets al módulo dedicado
setupSockets(io);

// Función de inicialización
const startServer = async () => {
  // 1. Probar conexión a la base de datos antes de levantar el servidor
  await connectDB();
  
  // 2. Inicializar estructura de base de datos (creación de tablas)
  await initDB();

  // 3. Levantar el servidor HTTP y WebSockets
  server.listen(PORT, () => {
    console.log(`🚀 Servidor HTTP base corriendo en http://localhost:${PORT}`);
    console.log(`⚡ Servidor WebSockets (Socket.io) listo y escuchando en el puerto ${PORT}`);
  });
};

startServer();
