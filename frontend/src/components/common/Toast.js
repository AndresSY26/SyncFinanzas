import './Toast.css';

export const showNotification = (message, type = 'error') => {
  let container = document.getElementById('global-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'global-toast-container';
    container.className = 'global-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `global-toast toast-${type}`;
  
  const icon = type === 'error' ? '⚠️' : '✅';
  toast.textContent = `${icon} ${message}`;

  container.appendChild(toast);

  // Animar entrada forzando un repintado previo
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });
  });

  // Auto destruir tras 4 segundos
  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => {
      toast.remove();
      if (container.childNodes.length === 0) {
        container.remove();
      }
    });
  }, 4000);
};
