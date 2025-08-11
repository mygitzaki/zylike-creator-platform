import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL || 'https://zylike-creator-platform-production.up.railway.app';

console.log('🔧 API Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  apiUrl: apiUrl,
  baseURL: `${apiUrl}/api`
});

const instance = axios.create({
  baseURL: `${apiUrl}/api`, // Your backend API
  withCredentials: true,    // 🔐 Send token/cookies
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Auth token from local storage
  console.log('🔑 Axios interceptor - Token present:', !!token);
  console.log('🔗 Request URL:', config.url);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('✅ Authorization header added');
  } else {
    console.log('❌ No token found in localStorage');
  }
  return config;
});

// Response interceptor to handle 401 errors
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('🚨 401 Unauthorized - Token may be invalid or expired');
      console.log('🔍 Current token:', localStorage.getItem('token'));
      // Don't auto-redirect on 401 for now, just log
    }
    return Promise.reject(error);
  }
);

export default instance;
