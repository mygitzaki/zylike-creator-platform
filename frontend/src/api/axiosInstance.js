import axios from 'axios';

const instance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`, // Your backend API
  withCredentials: true,                // 🔐 Send token/cookies
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Auth token from local storage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
