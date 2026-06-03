# SyncFinanzas ⚡

Repositorio privado para el desarrollo y control de versiones de **SyncFinanzas**, una suite financiera web de alta fidelidad.

## 📋 Estado Actual del Proyecto

- **Arquitectura:** Full-Stack (Vanilla JS en el Frontend, Node.js/Express en el Backend, PostgreSQL en Base de Datos).
- **Diseño:** Sistema de diseño personalizado con variables globales CSS, soportando Tema Claro y Tema Oscuro (Dark Mode) de forma nativa. Incluye componentes UI premium y reactivos (glassmorphism, micro-interacciones).
- **Módulos Implementados:**
  - Landing Page pública.
  - Sistema de Autenticación (Login/Registro fluido).
  - Dashboard Financiero (Resumen de balances, Gráficos de dona, Progreso de Presupuestos).
  - Gestión de Cuentas y Métodos de Pago (Tarjetas, Billeteras, Cuentas bancarias).
  - Historial Completo de Transacciones.
  - Configuración de Perfil y Seguridad (Control y auditoría de Sesiones Activas, configuración de 2FA).

## 🚀 Instrucciones de Despliegue Local

### Backend
1. Navegar al directorio `/backend`.
2. Asegurar que las credenciales en el archivo `.env` apunten a la base de datos PostgreSQL local.
3. Instalar dependencias: `npm install`.
4. Iniciar el servidor: `npm run dev` (por defecto en el puerto 3000).

### Frontend
1. Navegar al directorio `/frontend`.
2. Instalar dependencias: `npm install`.
3. Iniciar el servidor de desarrollo (Vite): `npm run dev` (por defecto en el puerto 5173).

## 🔒 Control de Seguridad y Buenas Prácticas
* **Repositorio Privado:** Este código fuente es cerrado.
* **Variables de Entorno:** Nunca hacer commit del archivo `.env` que contenga secretos de JWT o contraseñas reales de base de datos.
* **Estándares UI/UX:** Cualquier componente nuevo debe heredar de las variables globales de CSS (`var(--background-global)`, `var(--surface-card)`, `var(--text-primary)`, etc.) para no romper el ecosistema dinámico de Tema Oscuro.
