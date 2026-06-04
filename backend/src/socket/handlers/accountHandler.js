import { accountService } from '../../modules/accounts/account.service.js';

export const registerAccountHandlers = (io, socket) => {
  socket.on('account:list', async () => {
    try {
      if (!socket.userId) return;
      const accounts = await accountService.getAccountsByUserId(socket.userId);
      socket.emit('account:list_success', accounts);
    } catch (error) {
      console.error('Error fetching accounts for socket:', error);
      socket.emit('error:system', { code: 'ACCOUNT_LIST_ERROR', message: error.message });
    }
  });

  socket.on('account:create', async (payload) => {
    try {
      if (!socket.userId) return;
      const newAccount = await accountService.createAccount(socket.userId, payload);
      socket.emit('account:created_success', newAccount);
      
      // Emitir también la lista actualizada para todos
      const accounts = await accountService.getAccountsByUserId(socket.userId);
      socket.emit('account:list_success', accounts);
    } catch (error) {
      console.error('Error creating account via socket:', error);
      socket.emit('error:system', { code: 'ACCOUNT_CREATE_ERROR', message: error.message });
    }
  });
};
