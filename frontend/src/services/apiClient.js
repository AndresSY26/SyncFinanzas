export const apiClient = async (endpoint, options = {}) => {
  const token = localStorage.getItem('jwtToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`http://localhost:3000/api${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || 'Error en la petición API');
    error.data = data;
    throw error;
  }

  return data;
};
