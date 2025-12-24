import axios from 'axios';

// Log để debug
console.log('🔗 API Base URL:', import.meta.env.VITE_API_URL);

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    timeout: 30000, // 👈 THÊM: 30 seconds timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

// 👇 SỬA INTERCEPTOR NÀY
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            // ✅ Đảm bảo format đúng: "Bearer <token>"
            config.headers.Authorization = `Bearer ${token}`;
            console.log('🔐 Token sent:', token.substring(0, 20) + '...');
        } else {
            console.warn('⚠️ No token found in localStorage');
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor: Xử lý lỗi trả về
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.error('❌ 401 Unauthorized - Token invalid or expired');
            // Chỉ logout nếu không phải trang login/register
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;