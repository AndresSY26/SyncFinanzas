import { authService } from '../../services/authService.js';
import { showNotification } from '../../components/common/Toast.js';
import './Login.css';

export const renderLogin = (container) => {
  container.innerHTML = `
    <div class="auth-wrapper fade-up-enter">
      <div class="auth-card" id="authCard">
        <h2 id="formTitle" class="auth-title">Iniciar Sesión</h2>
        
        <form id="loginForm" class="auth-form" novalidate>
          <div id="loginStep1">
            <div class="input-group">
              <input type="email" id="loginEmail" class="auth-input" placeholder="Correo Electrónico">
            </div>
            <div class="input-group">
              <input type="password" id="loginPassword" class="auth-input" placeholder="Contraseña">
            </div>
            <button type="submit" id="btnSubmitLogin" class="auth-btn">Ingresar al Dashboard</button>

            <div class="auth-divider">o continúa con</div>
            <div id="google-btn-login" class="google-btn-container"></div>
          </div>

          <div id="loginStep2" style="display: none; animation: fadeIn 0.3s ease;">
            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 15px; text-align: center;">Tu cuenta está protegida. Ingresa el código de 6 dígitos de tu aplicación autenticadora.</p>
            <div class="input-group">
              <input type="text" id="login2FAToken" class="auth-input" placeholder="000 000" maxlength="7" style="text-align: center; font-size: 1.2rem; letter-spacing: 2px;">
            </div>
            <button type="button" id="btnVerifyLogin2FA" class="auth-btn active-btn">Verificar e Ingresar</button>
            <button type="button" id="btnCancelLogin2FA" class="settings-btn" style="width: 100%; margin-top: 10px;">Volver</button>
          </div>
        </form>

        <form id="registerForm" class="auth-form" style="display: none;" novalidate>
          <div class="input-group">
            <input type="text" id="regNombre" class="auth-input" placeholder="Nombre Completo">
          </div>
          <div class="input-group">
            <input type="text" id="regUsername" class="auth-input" placeholder="Username">
          </div>
          <div class="input-group">
            <input type="email" id="regEmail" class="auth-input" placeholder="Correo Electrónico">
          </div>
          <div class="input-group">
            <input type="password" id="regPassword" class="auth-input" placeholder="Contraseña">
          </div>
          <button type="submit" class="auth-btn">Crear Cuenta</button>

          <div class="auth-divider">o continúa con</div>
          <div id="google-btn-register" class="google-btn-container"></div>
        </form>

        <p class="auth-footer">
          <a href="#" id="toggleForm" class="auth-link">¿No tienes cuenta? Regístrate aquí</a>
        </p>
      </div>
    </div>
  `;

  const authCard = document.getElementById('authCard');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const toggleBtn = document.getElementById('toggleForm');
  const formTitle = document.getElementById('formTitle');

  // Alternar formularios
  toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Remover clases de error al cambiar de vista
    document.querySelectorAll('.auth-input').forEach(i => i.classList.remove('input-error'));

    if (loginForm.style.display === 'none') {
      loginForm.style.display = 'flex';
      registerForm.style.display = 'none';
      formTitle.innerText = 'Iniciar Sesión';
      toggleBtn.innerText = '¿No tienes cuenta? Regístrate aquí';
    } else {
      loginForm.style.display = 'none';
      registerForm.style.display = 'flex';
      formTitle.innerText = 'Crear Cuenta';
      toggleBtn.innerText = '¿Ya tienes cuenta? Inicia sesión aquí';
    }
  });

  // Lógica de Validación Visual Interactiva
  const triggerErrorFeedback = () => {
    authCard.classList.remove('shake');
    void authCard.offsetWidth; // Forzar reflow para reiniciar animación CSS
    authCard.classList.add('shake');
  };

  const validateInputs = (inputs) => {
    let isValid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    inputs.forEach(input => {
      input.classList.remove('input-error');
      
      // Validar vacío
      if (!input.value.trim()) {
        input.classList.add('input-error');
        isValid = false;
      } 
      // Validar email si corresponde
      else if (input.type === 'email' && !emailRegex.test(input.value)) {
        input.classList.add('input-error');
        isValid = false;
      }
    });

    if (!isValid) {
      triggerErrorFeedback();
    }
    return isValid;
  };

  // Variables for 2FA flow
  let pendingUserId = null;

  // Submit de Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Si estamos en step 2, no procesar el form submit regular
    if (document.getElementById('loginStep2').style.display === 'block') return;

    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const btnSubmitLogin = document.getElementById('btnSubmitLogin');
    
    if (!validateInputs([emailInput, passwordInput])) return;

    const originalText = btnSubmitLogin.textContent;
    btnSubmitLogin.textContent = 'Autenticando...';
    btnSubmitLogin.disabled = true;

    try {
      const result = await authService.login(emailInput.value, passwordInput.value);
      if (result.requiere_2fa) {
        pendingUserId = result.userId;
        document.getElementById('loginStep1').style.display = 'none';
        document.getElementById('loginStep2').style.display = 'block';
        document.getElementById('toggleForm').style.display = 'none';
      }
    } catch (error) {
      triggerErrorFeedback();
      showNotification(error.message, 'error');
    } finally {
      btnSubmitLogin.textContent = originalText;
      btnSubmitLogin.disabled = false;
    }
  });

  // Logica Step 2
  const tokenInput = document.getElementById('login2FAToken');
  tokenInput.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 3) {
      val = val.slice(0, 3) + ' ' + val.slice(3, 6);
    }
    e.target.value = val;
  });

  document.getElementById('btnVerifyLogin2FA').addEventListener('click', async () => {
    const code = tokenInput.value.replace(/\s/g, '');
    if (code.length !== 6) {
      showNotification('Debes ingresar 6 dígitos', 'error');
      return;
    }

    try {
      await authService.verify2FALogin(pendingUserId, code);
    } catch (error) {
      triggerErrorFeedback();
      showNotification(error.message || 'Código incorrecto', 'error');
    }
  });

  document.getElementById('btnCancelLogin2FA').addEventListener('click', () => {
    document.getElementById('loginStep2').style.display = 'none';
    document.getElementById('loginStep1').style.display = 'block';
    document.getElementById('toggleForm').style.display = 'block';
    tokenInput.value = '';
    pendingUserId = null;
  });

  // Submit de Registro
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nombreInput = document.getElementById('regNombre');
    const usernameInput = document.getElementById('regUsername');
    const emailInput = document.getElementById('regEmail');
    const passwordInput = document.getElementById('regPassword');

    if (!validateInputs([nombreInput, usernameInput, emailInput, passwordInput])) return;

    const payload = {
      nombre_completo: nombreInput.value,
      username: usernameInput.value,
      email: emailInput.value,
      password: passwordInput.value
    };

    try {
      await authService.register(payload);
      showNotification('¡Cuenta creada con éxito! Iniciando sesión...', 'success');
      
      // Auto-login after registration (optional, but good UX)
      setTimeout(async () => {
        try {
          await authService.login(emailInput.value, passwordInput.value);
        } catch (e) {
          showNotification(e.message, 'error');
        }
      }, 1500);

    } catch (error) {
      triggerErrorFeedback();
      showNotification(error.message, 'error');
    }
  });

  // --- Integración Real de Google One Tap y Botón ---
  window.handleGoogleCallback = async (response) => {
    try {
      await authService.authenticateWithGoogleToken(response.credential);
      showNotification('¡Sesión iniciada exitosamente con Google!', 'success');
    } catch (error) {
      triggerErrorFeedback();
      showNotification(error.message, 'error');
    }
  };

  window.initGoogleAuth = () => {
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: window.handleGoogleCallback,
      context: 'use'
    });

    const googleBtnConfig = { 
      theme: 'filled_black',
      size: 'large',
      shape: 'pill',
      width: 350,
      text: 'continue_with'
    };
    const btnLoginDiv = document.getElementById('google-btn-login');
    const btnRegisterDiv = document.getElementById('google-btn-register');

    if (btnLoginDiv) {
      window.google.accounts.id.renderButton(btnLoginDiv, googleBtnConfig);
    }
    if (btnRegisterDiv) {
      window.google.accounts.id.renderButton(btnRegisterDiv, googleBtnConfig);
    }

    // Iniciar One Tap Automático
    window.google.accounts.id.prompt();
  };

  // Inyectar Script GSI si no existe
  if (!document.getElementById('gsi-script')) {
    const script = document.createElement('script');
    script.id = 'gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = window.initGoogleAuth;
    document.head.appendChild(script);
  } else if (window.google) {
    window.initGoogleAuth();
  }
};
