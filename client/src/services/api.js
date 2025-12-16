import axios from 'axios';

// Tạo instance của axios
const api = axios.create({
    // Tự động lấy URL từ biến môi trường hoặc dùng localhost:5000
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: Tự động gắn Token vào mỗi request nếu đã đăng nhập
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor: Xử lý lỗi trả về (ví dụ: hết hạn token)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Nếu token hết hạn hoặc không hợp lệ, có thể logout (tuỳ chọn)
            // localStorage.removeItem('token');
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// QUAN TRỌNG: Phải có dòng này để sửa lỗi "does not provide an export named default"
export default api;