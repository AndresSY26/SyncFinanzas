# SyncFinanzas ⚡

Repositorio privado para el desarrollo y control de versiones de **SyncFinanzas**, una suite financiera web de alta fidelidad.

## 📦 Registro de Versiones

- **v1.1.0:** Arquitectura modular escalable (Feature-Driven), refactorización profunda con Capa de Servicios y migración definitiva de la autenticación a **Google OAuth2 Real (One Tap y SDK de Identity Services)**.
- **v1.0.0:** Configuración inicial del repositorio. Arquitectura Base y Diseño UI Premium con soporte nativo de variables CSS y Modo Oscuro.

## 📋 Estado Actual del Proyecto

- **Arquitectura Backend:** Node.js/Express estructurado mediante **Módulos Independientes (Feature-Driven Architecture)**, separando estrictamente enrutadores, controladores y una sólida capa de servicios (Data y Business Logic). Base de Datos PostgreSQL conectada bajo un pool centralizado.
- **Arquitectura Frontend:** Vanilla JS interactivo impulsado por Vite.
- **Diseño:** Sistema de diseño personalizado con variables globales CSS, soportando Tema Claro y Tema Oscuro (Dark Mode) de forma nativa. Incluye componentes UI premium y reactivos (glassmorphism, micro-interacciones).
- **Módulos Implementados:**
  - Landing Page pública.
  - Sistema de Autenticación Híbrida (Credenciales locales cifradas con Bcrypt y Login/Registro oficial con la librería de Google Cloud).
  - Dashboard Financiero (Resumen de balances, Gráficos de dona, Progreso de Presupuestos).
  - Gestión de Cuentas y Métodos de Pago (Tarjetas, Billeteras, Cuentas bancarias).
  - Historial Completo de Transacciones.
  - Configuración de Perfil y Seguridad (Auditoría de Sesiones Activas por IP/Dispositivo).

## 🚀 Instrucciones de Despliegue Local

### Backend
1. Navegar al directorio `/backend`.
2. Asegurar que el archivo `.env` contenga la cadena `DATABASE_URL` apuntando a PostgreSQL y el `GOOGLE_CLIENT_ID` de producción.
3. Instalar dependencias: `npm install`.
4. Iniciar el servidor: `npm run dev` (por defecto en el puerto 3000).

### Frontend
1. Navegar al directorio `/frontend`.
2. Asegurar que el archivo `.env` exista y contenga `VITE_GOOGLE_CLIENT_ID` con tu llave real para inyectarla en el SDK de Google.
3. Instalar dependencias: `npm install`.
4. Iniciar el servidor de desarrollo (Vite): `npm run dev` (por defecto en el puerto 5173).

## 🔒 Control de Seguridad y Buenas Prácticas
* **Repositorio Privado:** Este código fuente es cerrado.
* **Variables de Entorno:** Nunca hacer commit de los archivos `.env` (Frontend y Backend) que contienen secretos, credenciales de Google OAuth2 o cadenas de bases de datos.
* **Estándares UI/UX:** Cualquier componente nuevo debe heredar de las variables globales de CSS para no romper el ecosistema dinámico de Tema Oscuro.
