import { io } from 'socket.io-client';
import { appStore } from '../store/appStore.js';

let socketInstance = null;

export const SocketClient = {
  connect: (token) => {
    if (socketInstance) {
      socketInstance.disconnect();
    }
    
    socketInstance = io('http://localhost:3000', {
      auth: { token }
    });

    socketInstance.on('connect', () => {
      console.log('✅ Cliente WS Conectado. ID Global:', socketInstance.id);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('❌ Error de WS:', err.message);
    });

    // Delegamos los eventos al Store
    socketInstance.on('balance:updated', (data) => {
      appStore.updateBalance(data);
    });

    socketInstance.on('transaction:history', (txs) => {
      appStore.setTransactions(txs);
    });

    socketInstance.on('transaction:created_success', (tx) => {
      appStore.addTransaction(tx);
    });

    socketInstance.on('budget:alert', (alertData) => {
      appStore.notifyAlert(alertData);
    });
  },

  getSocket: () => socketInstance,

  disconnect: () => {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }
  }
};
