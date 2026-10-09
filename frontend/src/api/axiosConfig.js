import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: window.location.origin + '/api',    timeout: 30000,
});

// Добавляем токен к запросам
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        
        
        return config;
    },
    (error) => Promise.reject(error)
);

// Авто-рефреш токена при 401
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('No token');
                
                const res = await axios.post('https://ed-space.ru/api/auth/refresh-token', {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                localStorage.setItem('token', res.data.token);
                originalRequest.headers.Authorization = `Bearer ${res.data.token}`;
                
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

export default axiosInstance;