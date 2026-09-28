import axios from 'axios';

const api = axios.create({
  // Cambia localhost por tu URL de producción
  baseURL: 'https://burned.onrender.com', 
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;