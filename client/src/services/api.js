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
        // 👇 THÊM: Xử lý 403 (banned account)
        if (error.response && error.response.status === 403) {
            const errorData = error.response.data;
            
            if (errorData?.isBanned || errorData?.error === 'Account Suspended') {
                console.error('🚫 Account Suspended');
                localStorage.removeItem('token');
                
                // Hiển thị alert với message từ server
                alert(errorData.message || 'Your account has been suspended. Please contact support.');
                
                window.location.href = '/login';
            }
        }
        
        // 👇 GIỮ NGUYÊN: Xử lý 401
        if (error.response && error.response.status === 401) {
            const errorData = error.response.data;
            
            // Nếu là token expired/invalid
            if (errorData?.error === 'Token expired' || errorData?.error === 'Invalid token') {
                console.error('🔒 Token invalidated - logging out');
                localStorage.removeItem('token');
                
                if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
                    alert('Your session has expired. Please login again.');
                    window.location.href = '/login';
                }
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;