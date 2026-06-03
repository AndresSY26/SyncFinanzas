import './Settings.css';
import { appStore } from '../../store/appStore.js';
import { showNotification } from '../../components/common/Toast.js';
import { apiClient } from '../../services/apiClient.js';

export const renderSettings = (container) => {
  const user = appStore.state.user || {};

  container.innerHTML = `
    <div class="settings-header">
      <h2 style="margin: 0; color: var(--text-primary);">Configuración de Perfil y Seguridad</h2>
      <p style="color: var(--text-secondary); margin-top: 5px;">Administra tu información personal y opciones de seguridad.</p>
    </div>

    <div class="settings-grid">
      <!-- Módulo Perfil -->
      <div class="settings-card">
        <div class="card-title">
          <i class="ri-user-settings-line"></i> Información Personal
        </div>
        <form id="profileForm">
          <div class="input-group">
            <label class="settings-label">Nombre Completo</label>
            <input type="text" id="profFullName" class="settings-input" value="${user.nombre_completo || ''}">
          </div>
          <div class="input-group">
            <label class="settings-label">Nombre de Usuario</label>
            <input type="text" id="profUsername" class="settings-input" value="${user.username || ''}">
          </div>
          <div class="input-group">
            <label class="settings-label">Correo Electrónico</label>
            <input type="email" id="profEmail" class="settings-input" value="${user.email || ''}" readonly>
          </div>
          <button type="submit" id="btnSaveProfile" class="settings-btn" disabled>Guardar Cambios</button>
        </form>
      </div>

      <!-- Módulo Seguridad -->
      <div class="settings-card">
        <div class="card-title">
          <i class="ri-shield-keyhole-line"></i> Cambio de Credenciales
        </div>
        <form id="securityForm">
          <div class="input-group">
            <label class="settings-label">Contraseña Actual</label>
            <input type="password" id="secCurrent" class="settings-input" placeholder="Ingresa tu contraseña actual" required>
          </div>
          <div class="input-group">
            <label class="settings-label">Nueva Contraseña</label>
            <input type="password" id="secNew" class="settings-input" placeholder="Nueva contraseña segura" required>
          </div>
          <div class="input-group">
            <label class="settings-label">Confirmar Nueva Contraseña</label>
            <input type="password" id="secConfirm" class="settings-input" placeholder="Repite tu nueva contraseña" required>
          </div>
          <button type="submit" id="btnSaveSecurity" class="settings-btn" disabled>Actualizar Seguridad</button>
        </form>
      </div>

      <!-- Módulo 2FA (TOTP) -->
      <div class="settings-card">
        <div class="card-title">
          <i class="ri-smartphone-line"></i> Autenticación de Dos Factores (2FA)
        </div>
        <div id="twoFaInitialState">
          <p style="color: #666; font-size: 0.95rem; margin-bottom: 20px;">
            Protege tu cuenta con una capa de seguridad adicional. Usa una aplicación como Google Authenticator o Authy.
          </p>
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 15px; background: var(--background-global); border-radius: 8px; border: 1px solid rgba(123, 44, 191, 0.2); margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 10px; height: 10px; border-radius: 50%; background: var(--text-secondary);"></div>
              <span style="font-weight: 600; color: var(--text-secondary);">Estado: Inactivo</span>
            </div>
          </div>
          <button type="button" id="btnEnable2FA" class="settings-btn active-btn" style="margin-top: 0;">Habilitar 2FA</button>
        </div>

        <div id="twoFaSetupState" style="display: none; animation: fadeIn 0.3s ease;">
          <p style="color: #666; font-size: 0.9rem; margin-bottom: 15px;">Escanea este código QR con tu aplicación de autenticación:</p>
          <div class="qr-mock">
            <i class="ri-qr-code-line" style="font-size: 5rem; color: var(--primary-purple);"></i>
          </div>
          <div class="input-group" style="margin-bottom: 15px;">
            <label class="settings-label">O ingresa esta llave secreta manualmente:</label>
            <div style="display: flex; gap: 10px;">
              <input type="text" class="settings-input" value="G3J7 V2KX P9MZ L4QW" readonly style="font-family: monospace; letter-spacing: 2px; text-align: center;">
              <button type="button" class="settings-btn active-btn" style="width: auto; margin: 0; padding: 0 15px;" onclick="navigator.clipboard.writeText('G3J7V2KXP9MZL4QW')"><i class="ri-clipboard-line"></i></button>
            </div>
          </div>
          <form id="form2FA">
            <div class="input-group">
              <label class="settings-label">Código de Verificación (6 dígitos)</label>
              <input type="text" id="totpInput" class="settings-input totp-input" placeholder="000 000" maxlength="7" required autocomplete="off">
            </div>
            <div style="display: flex; gap: 10px; margin-top: 15px;">
              <button type="button" id="btnCancel2FA" class="settings-btn" style="margin: 0; flex: 1;">Cancelar</button>
              <button type="submit" id="btnVerify2FA" class="settings-btn active-btn" style="margin: 0; flex: 1;">Verificar</button>
            </div>
          </form>
        </div>

        <div id="twoFaActiveState" style="display: none; animation: fadeIn 0.3s ease;">
          <p style="color: #666; font-size: 0.95rem; margin-bottom: 20px;">
            Tu cuenta está altamente protegida. Se requerirá un código temporal en cada nuevo inicio de sesión.
          </p>
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 15px; background: rgba(40, 167, 69, 0.1); border-radius: 8px; border: 1px solid rgba(40, 167, 69, 0.3); margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 10px; height: 10px; border-radius: 50%; background: #28a745; box-shadow: 0 0 8px rgba(40, 167, 69, 0.6);"></div>
              <span style="font-weight: 600; color: #28a745;">Estado: Activado ✓</span>
            </div>
          </div>
          <button type="button" class="settings-btn btn-danger" style="margin-top: 0;">Deshabilitar 2FA</button>
        </div>
      </div>
      
      <!-- Auditoría de Sesiones -->
      <div class="settings-card" style="grid-column: 1 / -1;">
        <div class="card-title">
          <i class="ri-macbook-line"></i> Sesiones y Dispositivos Activos
        </div>
        <p style="color: #666; font-size: 0.95rem; margin-bottom: 20px;">
          Revisa los dispositivos en los que actualmente has iniciado sesión. Puedes revocar el acceso de cualquier dispositivo desconocido.
        </p>
        
        <div class="sessions-list" id="sessionsListContainer">
          <p style="color: #888; text-align: center; margin-top: 20px;">Cargando sesiones...</p>
        </div>
      </div>

    </div>
  `;

  attachEvents();
  loadSessions();
};

const parseUserAgent = (ua) => {
  if (!ua) return 'Dispositivo Desconocido';
  
  let browser = 'Navegador';
  let browserVersion = '';
  if (/Chrome\/(\d+)/i.test(ua)) { browser = 'Chrome'; browserVersion = ua.match(/Chrome\/(\d+)/i)[1]; }
  else if (/Firefox\/(\d+)/i.test(ua)) { browser = 'Firefox'; browserVersion = ua.match(/Firefox\/(\d+)/i)[1]; }
  else if (/Safari\/(\d+)/i.test(ua) && !/Chrome/i.test(ua)) { browser = 'Safari'; browserVersion = ua.match(/Version\/(\d+)/i)?.[1] || ''; }
  else if (/Edge\/(\d+)/i.test(ua)) { browser = 'Edge'; browserVersion = ua.match(/Edge\/(\d+)/i)?.[1] || ''; }

  let os = 'Sistema';
  let osVersion = '';
  if (/Windows NT (\d+\.\d+)/i.test(ua)) { 
    os = 'Windows'; 
    const v = ua.match(/Windows NT (\d+\.\d+)/i)[1];
    osVersion = v === '10.0' ? '10/11' : v;
  }
  else if (/Mac OS X (\d+[_.]\d+)/i.test(ua)) { 
    os = 'macOS'; 
    osVersion = ua.match(/Mac OS X (\d+[_.]\d+)/i)[1].replace(/_/g, '.');
  }
  else if (/Android (\d+(\.\d+)?)/i.test(ua)) { 
    os = 'Android'; 
    osVersion = ua.match(/Android (\d+(\.\d+)?)/i)[1];
  }
  else if (/iPhone OS (\d+[_.]\d+)/i.test(ua)) { 
    os = 'iOS'; 
    osVersion = ua.match(/iPhone OS (\d+[_.]\d+)/i)[1].replace(/_/g, '.');
  }
  else if (/Linux/i.test(ua)) { os = 'Linux'; }

  const isMobile = /Mobile|Android|iP(hone|od|ad)/i.test(ua);
  
  const bStr = browserVersion ? `${browser} v${browserVersion}` : browser;
  const oStr = osVersion ? `${os} ${osVersion}` : os;

  return isMobile ? `Dispositivo Móvil (${oStr})` : `${bStr} en ${oStr}`;
};

const getIconForDevice = (deviceStr) => {
  if (/Windows/i.test(deviceStr)) return 'ri-windows-line';
  if (/macOS|iOS/i.test(deviceStr)) return 'ri-apple-line';
  if (/Android|Móvil/i.test(deviceStr)) return 'ri-smartphone-line';
  return 'ri-macbook-line';
};

const formatDateTime = (isoString) => {
  if (!isoString) return 'Fecha desconocida';
  const d = new Date(isoString);
  const pad = (n) => n.toString().padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = pad(d.getMinutes());
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; 
  return `${day}/${month}/${year} • ${pad(hours)}:${minutes} ${ampm}`;
};

const loadSessions = async () => {
  const container = document.getElementById('sessionsListContainer');
  if (!container) return;

  try {
    const sessions = await apiClient('/auth/sessions');
    
    if (sessions.length === 0) {
      container.innerHTML = '<p style="color: #888; text-align: center;">No hay sesiones activas registradas.</p>';
      return;
    }

    container.innerHTML = sessions.map((session, index) => {
      const parsedDevice = parseUserAgent(session.dispositivo);
      const icon = getIconForDevice(parsedDevice);
      
      const currentToken = localStorage.getItem('jwtToken');
      const isCurrent = session.activa && session.token_hash === currentToken;
      
      let displayLocation = session.ip_origen;
      if (displayLocation === '::1' || displayLocation === '127.0.0.1' || displayLocation.includes('::ffff:127.0.0.1')) {
        displayLocation = 'Bogotá, Colombia';
      }

      let badgeHtml = '';
      if (!session.activa) {
        badgeHtml = '<span class="inactive-badge">Sesión Cerrada</span>';
      } else if (isCurrent) {
        badgeHtml = '<span class="current-badge">Este dispositivo</span>';
      } else {
        badgeHtml = '<button type="button" class="settings-btn btn-danger btn-sm btn-revoke">Revocar Acceso</button>';
      }

      const rowClass = !session.activa ? 'inactive-session' : (isCurrent ? 'active-session' : '');
      const metaText = !session.activa 
        ? `Último acceso: ${formatDateTime(session.ultima_conexion)}` 
        : (isCurrent ? '<strong>Activa ahora</strong>' : `Conectado recientemente (${formatDateTime(session.ultima_conexion)})`);

      return `
        <div class="session-row ${rowClass}" data-id="${session.id}">
          <div class="session-info">
            <div class="session-icon"><i class="${icon}"></i></div>
            <div class="session-details">
              <p class="session-device">${parsedDevice}</p>
              <p class="session-meta">${displayLocation} • ${metaText}</p>
            </div>
          </div>
          <div class="session-actions">
            ${badgeHtml}
          </div>
        </div>
      `;
    }).join('');

    attachSessionEvents();
  } catch (error) {
    container.innerHTML = '<p style="color: #dc3545; text-align: center;">Error al cargar las sesiones.</p>';
    console.error(error);
  }
};

const attachSessionEvents = () => {
  const revokeBtns = document.querySelectorAll('.btn-revoke');
  revokeBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const row = e.target.closest('.session-row');
      const sessionId = row.getAttribute('data-id');
      
      try {
        await apiClient('/auth/sessions/revoke', {
          method: 'POST',
          body: JSON.stringify({ sessionId })
        });
        
        row.style.opacity = '0';
        setTimeout(() => {
          row.remove();
          showNotification('Sesión revocada. El dispositivo ha sido desconectado.', 'success');
        }, 300);
      } catch (error) {
        showNotification('No se pudo revocar la sesión', 'error');
      }
    });
  });
};

const attachEvents = () => {
  const user = appStore.state.user || {};

  // DOM elements - Profile
  const profileForm = document.getElementById('profileForm');
  const profFullName = document.getElementById('profFullName');
  const profUsername = document.getElementById('profUsername');
  const profEmail = document.getElementById('profEmail');
  const btnSaveProfile = document.getElementById('btnSaveProfile');

  // DOM elements - Security
  const securityForm = document.getElementById('securityForm');
  const secCurrent = document.getElementById('secCurrent');
  const secNew = document.getElementById('secNew');
  const secConfirm = document.getElementById('secConfirm');
  const btnSaveSecurity = document.getElementById('btnSaveSecurity');

  // Validation logic for Profile
  const checkProfileChanges = () => {
    const fn = profFullName.value.trim();
    const un = profUsername.value.trim();
    
    // Check if any editable field differs from initial store
    if (fn !== (user.nombre_completo || '') || un !== (user.username || '')) {
      btnSaveProfile.disabled = false;
      btnSaveProfile.classList.add('active-btn');
    } else {
      btnSaveProfile.disabled = true;
      btnSaveProfile.classList.remove('active-btn');
    }
  };

  profFullName.addEventListener('input', checkProfileChanges);
  profUsername.addEventListener('input', checkProfileChanges);

  // Validation logic for Security
  const checkSecurityChanges = () => {
    const cur = secCurrent.value.trim();
    const nw = secNew.value.trim();
    const cnf = secConfirm.value.trim();

    if (cur.length > 0 && nw.length > 0 && cnf.length > 0) {
      btnSaveSecurity.disabled = false;
      btnSaveSecurity.classList.add('active-btn');
    } else {
      btnSaveSecurity.disabled = true;
      btnSaveSecurity.classList.remove('active-btn');
    }
  };

  secCurrent.addEventListener('input', checkSecurityChanges);
  secNew.addEventListener('input', checkSecurityChanges);
  secConfirm.addEventListener('input', checkSecurityChanges);

  // Submit Profile
  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    appStore.updateUser({
      nombre_completo: profFullName.value.trim(),
      username: profUsername.value.trim()
      // email is readonly
    });
    showNotification('¡Configuración de perfil actualizada con éxito! ✓', 'success');
    
    // reset button state
    btnSaveProfile.disabled = true;
    btnSaveProfile.classList.remove('active-btn');
  });

  // Submit Security
  securityForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const nw = secNew.value.trim();
    const cnf = secConfirm.value.trim();

    if (nw !== cnf) {
      return showNotification('Las contraseñas no coinciden. Verifícalas e intenta de nuevo.', 'error');
    }

    // Simulate security update
    showNotification('¡Credenciales de seguridad actualizadas con éxito! ✓', 'success');
    
    securityForm.reset();
    btnSaveSecurity.disabled = true;
    btnSaveSecurity.classList.remove('active-btn');
  });

  // 2FA Logic
  const btnEnable2FA = document.getElementById('btnEnable2FA');
  const btnCancel2FA = document.getElementById('btnCancel2FA');
  const form2FA = document.getElementById('form2FA');
  const totpInput = document.getElementById('totpInput');
  const stateInitial = document.getElementById('twoFaInitialState');
  const stateSetup = document.getElementById('twoFaSetupState');
  const stateActive = document.getElementById('twoFaActiveState');

  if (btnEnable2FA) {
    btnEnable2FA.addEventListener('click', () => {
      stateInitial.style.display = 'none';
      stateSetup.style.display = 'block';
    });
  }

  if (btnCancel2FA) {
    btnCancel2FA.addEventListener('click', () => {
      stateSetup.style.display = 'none';
      stateInitial.style.display = 'block';
      form2FA.reset();
    });
  }

  // Format TOTP input (adds space in the middle: XXX XXX)
  if (totpInput) {
    totpInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\\D/g, '');
      if (val.length > 3) {
        val = val.slice(0, 3) + ' ' + val.slice(3, 6);
      }
      e.target.value = val;
    });
  }

  if (form2FA) {
    form2FA.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = totpInput.value.replace(/\\s/g, '');
      if (code.length === 6) {
        stateSetup.style.display = 'none';
        stateActive.style.display = 'block';
        showNotification('Autenticación de Dos Factores (2FA) vinculada correctamente', 'success');
      } else {
        showNotification('Código inválido. Asegúrate de ingresar 6 dígitos.', 'error');
      }
    });
  }

};
