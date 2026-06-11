# SyncFinanzas ⚡

## 📖 Project Overview
**SyncFinanzas** is a high-fidelity, reactive web financial suite designed to provide users with complete control over their personal finances. Built with real-time capabilities at its core, the platform allows users to manage multiple accounts, track transactions, set budgets, and achieve savings goals seamlessly. Its architecture is deeply modular, ensuring high performance, scalability, and maintainability.

> 🏆 **v1.7.0 Milestone**: SyncFinanzas introduces **"Blindaje integral V10"**. Featuring atomic Core Bancario validations, a fault-tolerant SMTP layer, and an optimized Gemini Cache system. Every single chart, balance, and setting in the dashboard is authentically powered by a real, live PostgreSQL database and a reactive WebSocket engine. 

---

## 🏛 Architecture

The project follows a **Feature-Driven** and **Real-Time** architecture, cleanly separating concerns between the frontend and the backend.

### Backend (`/backend`)
- **Framework:** Node.js with Express.js.
- **Real-Time Communication:** Driven by **Socket.io**. While authentication utilizes standard HTTP REST endpoints, the core financial data operations (Transactions, Accounts, Budgets, Goals) flow over WebSockets. This reactive pattern ensures instantaneous updates to the connected client.
- **Database (Core Bancario):** PostgreSQL, accessed via a centralized connection pool (`pg`). The relational schema (`schema.sql`) efficiently manages data with highly optimized indexes. It features **atomic transactions (`BEGIN/COMMIT`)** with strict banking-level protections against account overdrafts and cross-currency mismatches.
- **Authentication:** Advanced Hybrid Security Strategy.
  - Local credentials encrypted securely with `bcrypt`.
  - Google OAuth2 Integration using `google-auth-library`.
  - **Two-Factor Authentication (2FA)** powered by `otplib` (TOTP) and `qrcode`.
  - Staged Login flows and persistent, hash-protected JSON Web Tokens (JWT) for secure session revocation.
  - Native IP Geolocation and User-Agent tracking for granular session monitoring.
- **AI & Analytics (Gemini Cache):** Integrates `@google/generative-ai` (Gemini 2.5 Flash) for providing real-time financial insights based on predictive linear regression models. Implements an **in-memory Cache TTL layer** to prevent excessive LLM API calls, optimizing costs and latency.
- **Notifications (Fault-Tolerant SMTP):** Automated email delivery via `nodemailer` for critical budget alerts and savings goal achievements, featuring automatic rollback mechanisms if the SMTP server fails.
- **Structure:** Modular Feature-Driven structure. Each domain (including the new `analytics` module) encapsulates its own handlers, controllers, and routes, decoupling the business logic from the transport layer.

### Frontend (`/frontend`)
- **Framework:** Vanilla JavaScript bundled via **Vite**. The client avoids heavy UI frameworks (like React or Vue) in favor of deep DOM manipulation and native Web API usage, delivering a lightweight and extremely fast user experience.
- **State Management:** Custom Publish/Subscribe (Pub/Sub) pattern implemented through the native `EventTarget` API (`AppStore.js`). The store intercepts WebSocket events and reactively updates the UI components.
- **Routing:** Custom client-side router (`Router.js`) leveraging the History API for Single Page Application (SPA) behavior, complete with an Authentication Guard to protect private routes.
- **Real-Time Client:** `socket.io-client` listening to backend broadcasts to keep financial data synchronized.
- **UI/UX & Design System:**
  - Modern, responsive styling with native CSS Variables.
  - Native support for both **Light and Dark Mode** toggling.
  - Dynamic interactive data visualization using **Chart.js** (e.g., Expense distribution doughnut charts, chronological trends).
  - Advanced **Micro-UX** features (glassmorphism, emotional budget progress bars that shift color based on spending proximity).

---

## ✨ Key Features

1. **Hybrid Security & 2FA Authentication:**
   - Standard email/password registration with a staged login process.
   - Cryptographic **Two-Factor Authentication (TOTP)** setup via QR code scanning.
   - 1-Click Login integration via Google Identity Services (One Tap).
   - In-app **Profile Management** to easily update personal information and **Password Changing** capabilities.
   - Security auditing allowing users to review and revoke active sessions mapped by real geolocation and device names.

2. **Real-Time Financial Dashboard:**
   - Live synchronization of total balances across all accounts.
   - Dynamic Doughnut charts visualizing expense distribution.
   - Smoothed chronological trend charts for incomes vs. expenses.

3. **Multi-Account Management:**
   - Centralized tracking for various financial sources including Bank accounts, Credit/Debit Cards, and E-Wallets.

4. **Transaction Tracking:**
   - Comprehensive history of incomes and expenses.
   - Real-time transaction broadcasting to the UI instantly upon creation.

5. **Budgets & Emotional Micro-UX:**
   - Configurable budget limits per category.
   - Visual progress bars that intelligently adapt their context and color based on spending thresholds (Emotional Micro-UX).
   - Real-time alerts when budgets are approaching or exceeding limits.

6. **Savings Goals Widget:**
   - Set financial goals attached to specific linked accounts and visually track real-time funding progress.

7. **🤖 AI Smart Coach (Gemini Cache):**
   - Real-time financial insights powered by Google Gemini 2.5 Flash.
   - Evaluates a user's financial context (budgets, goals, and linear regression spending predictions) to generate proactive alerts, immediate actions, and savings strategies.
   - Supported by a robust in-memory caching system to guarantee low-latency performance and prevent redundant API queries.

8. **📧 Fault-Tolerant Automated Email Notifications:**
   - Intelligent event-driven triggers via SMTP (Nodemailer).
   - Instant rich-HTML email alerts when budget limits are breached or when savings goals are successfully accomplished.
   - Built-in SQL state rollback mechanisms to prevent data desync in case of SMTP server unreachability.

9. **⇄ Internal Transfers (Core Bancario):**
   - Seamlessly transfer funds between your own linked accounts (e.g., from Bank to Wallet) with a dedicated UI flow.
   - Backed by strict atomic `BEGIN/COMMIT` Postgres transactions ensuring overdraft prevention and cross-currency rejection logic.

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js** (v18+ recommended)
- **PostgreSQL** database instance running locally or remotely.
- **Google Cloud Console Project** with OAuth 2.0 Client IDs configured.

### 1. Database Configuration
1. Ensure PostgreSQL is installed and running on your system.
2. Create a database named `syncfinanzas_db`.
3. The backend script will automatically execute `schema.sql` to create the required tables and indexes upon the first connection.

### 2. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a `.env` file in the root of the `backend` directory based on these required variables:
   ```env
   PORT=3000
   DATABASE_URL=postgresql://<user>:<password>@localhost:5432/syncfinanzas_db
   JWT_SECRET=your_super_secret_jwt_key
   GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   GEMINI_API_KEY=your_gemini_api_key_for_smart_coach
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   *The HTTP server will bind to port 3000, and the WebSocket server will automatically attach.*

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Create a `.env` file in the `frontend` directory:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The client application will typically be accessible at `http://localhost:5173`.*

---

## 📂 Directory Structure

```text
SyncFinanzas/
├── backend/                  # Node.js + Express + Socket.io Server
│   ├── src/
│   │   ├── config/           # DB configuration and SQL Schema (`schema.sql`)
│   │   ├── middlewares/      # Express & Socket Auth Guards
│   │   ├── modules/          # Feature domains (Auth, Accounts, Budgets, etc.)
│   │   ├── socket/           # WebSocket Handlers and Observers
│   │   ├── utils/            # Helper functions
│   │   └── server.js         # Backend Entry point
│   └── package.json
└── frontend/                 # Vanilla JS + Vite Client
    ├── src/
    │   ├── components/       # Reusable UI modules (Navbar, Footer, Modal)
    │   ├── core/             # Custom SPA Router & Socket Client wrapper
    │   ├── services/         # HTTP API Services (Auth)
    │   ├── store/            # Central State Management (EventTarget Pub/Sub)
    │   ├── styles/           # CSS Variables (Dark/Light mode) & Animations
    │   ├── utils/            # Client-side formatters and helpers
    │   ├── views/            # SPA Pages (Dashboard, Login, Settings, etc.)
    │   └── main.js           # Frontend Entry point
    ├── index.html
    └── package.json
```

## 🛡️ Best Practices & Security Notes
- **Environment Variables:** Never commit `.env` files. They contain sensitive database connection strings and OAuth secrets.
- **UI Consistency:** Any new UI components must inherit styling from the global CSS variables (`frontend/src/styles/variables.css`) to ensure the dynamic Light/Dark mode ecosystem remains intact.
