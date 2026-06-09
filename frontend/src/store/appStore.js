// Implementación de Store y EventTarget para patrón Pub/Sub
class AppStore extends EventTarget {
  constructor() {
    super();
    this.state = {
      user: {
        nombre_completo: 'Andres Rodriguez',
        username: 'AndRoy',
        email: 'andresksa123@gmail.com'
      },
      balance: [],
      transactions: [],
      paymentMethods: [],
      accountBalances: [],
      budgets: {},
      savingsGoals: [],
      theme: 'light',
      historyFilter: 'Todos'
    };

    // Inicializar el tema desde localStorage
    const savedTheme = localStorage.getItem('syncfinanzas-theme');
    if (savedTheme === 'dark') {
      this.state.theme = 'dark';
      document.documentElement.classList.add('dark');
    }
  }

  addPaymentMethod(method) {
    this.state.paymentMethods.unshift(method);
    this.dispatchEvent(new CustomEvent('payment_methods_changed', { detail: this.state.paymentMethods }));
  }

  setPaymentMethods(methods) {
    this.state.paymentMethods = methods;
    this.dispatchEvent(new CustomEvent('payment_methods_changed', { detail: this.state.paymentMethods }));
  }

  updateUser(data) {
    this.state.user = { ...this.state.user, ...data };
    this.dispatchEvent(new CustomEvent('user_updated', { detail: this.state.user }));
  }

  updateBalance(data) {
    this.state.balance = data;
    this.dispatchEvent(new CustomEvent('balance_changed', { detail: this.state.balance }));
  }

  addTransaction(tx) {
    this.state.transactions.unshift(tx);
    this.dispatchEvent(new CustomEvent('transaction_added', { detail: tx }));
  }

  setTransactions(txs) {
    this.state.transactions = txs;
    this.dispatchEvent(new CustomEvent('transaction_history_loaded', { detail: txs }));
  }

  setAccountBalances(balances) {
    this.state.accountBalances = balances;
    this.dispatchEvent(new CustomEvent('account_balances_loaded', { detail: balances }));
  }

  notifyAlert(alertData) {
    this.dispatchEvent(new CustomEvent('budget_alert', { detail: alertData }));
  }
  
  setBudgets(budgetsList) {
    this.state.budgets = budgetsList || [];
    this.dispatchEvent(new CustomEvent('budgets_loaded', { detail: this.state.budgets }));
  }

  setSavingsGoals(goals) {
    this.state.savingsGoals = goals;
    this.dispatchEvent(new CustomEvent('goals_loaded', { detail: this.state.savingsGoals }));
  }
  
  getCategoryExpenses() {
    const expenses = new Map();
    this.state.transactions.forEach(tx => {
      if (tx.tipo === 'expense' && tx.categoria) {
        const cat = String(tx.categoria);
        if (cat === '__proto__' || cat === 'constructor' || cat === 'prototype') return;
        expenses.set(cat, (expenses.get(cat) || 0) + parseFloat(tx.monto));
      }
    });
    return Object.fromEntries(expenses);
  }

  getBudgetLimit(categoria) {
    if (!categoria) return 300;
    const cat = String(categoria);
    if (cat === '__proto__' || cat === 'constructor' || cat === 'prototype') return 300;

    if (Array.isArray(this.state.budgets)) {
      const budgetObj = this.state.budgets.find(b => b.categoria === cat);
      if (budgetObj) return parseFloat(budgetObj.monto_limite);
    }
    
    const fallbacks = new Map([
      ['Comida', 500],
      ['Transporte', 200],
      ['Servicios', 300],
      ['Entretenimiento', 250],
      ['Otros', 150]
    ]);
    
    if (fallbacks.has(cat)) {
      return fallbacks.get(cat);
    }
    return 300;
  }

  getBalance() {
    return this.state.balance;
  }

  toggleTheme() {
    const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
    this.state.theme = newTheme;
    localStorage.setItem('syncfinanzas-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    this.dispatchEvent(new CustomEvent('theme_changed', { detail: newTheme }));
  }
}

export const appStore = new AppStore();
