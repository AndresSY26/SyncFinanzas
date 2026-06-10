import { apiClient } from './apiClient.js';
import { SocketClient } from '../core/socket.js';
import { Router } from '../core/router.js';
import { appStore } from '../store/appStore.js';

export const authService = {
  login: async (email, password) => {
    const data = await apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (data.requiere_2fa) {
      return data; // Return the flag and userId
    }

    authService.initSession(data.token, data.user);
    return data;
  },

  verify2FALogin: async (userId, token) => {
    const data = await apiClient('/auth/2fa/verify-login', {
      method: 'POST',
      body: JSON.stringify({ userId, token })
    });
    authService.initSession(data.token, data.user);
    return data;
  },

  register: async (payload) => {
    const data = await apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    authService.initSession(data.token, data.user);
    return data;
  },

  authenticateWithGoogleToken: async (idToken) => {
    const data = await apiClient('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken })
    });
    authService.initSession(data.token, data.user);
    return data;
  },

  initSession: (token, user) => {
    localStorage.setItem('jwtToken', token);
    if (user) {
      appStore.updateUser(user);
    }
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
