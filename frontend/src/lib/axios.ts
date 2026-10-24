import axios from 'axios';

// Fungsi bantuan untuk membuat token unik jika user belum punya
const generateSessionToken = () => {
  return 'svr-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // 1. Tangani Auth Token (Untuk Admin / User Login)
    const token = localStorage.getItem('admin_token') || localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Tangani Session Token (KTP untuk Guest Pembeli Tiket) - INI FIX NYA
    let sessionToken = localStorage.getItem('svara_session_token_v2');
    
    // Jika tidak ada token (user baru pertama kali buka web), buatkan dan simpan
    if (!sessionToken) {
      sessionToken = generateSessionToken();
      localStorage.setItem('svara_session_token_v2', sessionToken);
    }

    // Suntikkan token ini ke setiap request API yang keluar
    config.headers['X-Session-Token'] = sessionToken;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const isAdmin = window.location.pathname.startsWith('/admin');
        if (isAdmin) {
          localStorage.removeItem('admin_token');
          window.location.href = '/admin/login';
        } else {
          localStorage.removeItem('auth_token');
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;