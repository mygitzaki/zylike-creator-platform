import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
console.log('🔗 API URL being used:', apiUrl);

const instance = axios.create({
  baseURL: `${apiUrl}/api`, // Your backend API
  withCredentials: true,    // 🔐 Send token/cookies
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Auth token from local storage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
