import { apiClient } from './apiClient.js';
import { SocketClient } from '../core/socket.js';
import { Router } from '../core/router.js';

export const authService = {
  login: async (email, password) => {
    const data = await apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    authService.initSession(data.token);
    return data;
  },

  register: async (payload) => {
    const data = await apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    authService.initSession(data.token);
    return data;
  },

  initSession: (token) => {
    localStorage.setItem('jwtToken', token);
    SocketClient.connect(token);
    Router.navigate('/dashboard');
  },

  logout: async () => {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Error al desloguearse en backend', e);
    }
    SocketClient.disconnect();
    localStorage.removeItem('jwtToken');
    Router.navigate('/login');
  }
};
