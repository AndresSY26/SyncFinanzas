export const formatCurrency = (amount, currency = 'COP') => {
  return new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: currency, 
    minimumFractionDigits: 2 
  }).format(amount);
};
