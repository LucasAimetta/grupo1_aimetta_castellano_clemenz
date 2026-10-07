import axios from 'axios';

const api = axios.create({
  //baseURL: 'https://burned.onrender.com', 
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080', 
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