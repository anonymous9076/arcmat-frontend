import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
    // baseURL: '/api/proxy',
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
});

// Add a request interceptor to include the token in all requests
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle 401 unauthorized errors
api.interceptors.response.use(
    (response) => {
        // Return successful responses as-is
        return response;
    },
    (error) => {
        // Check if error is 401 Unauthorized
        if (error.response && error.response.status === 401) {
            const requestUrl = error.config?.url || '';
            const isLoginRequest = requestUrl.includes('/user/login');

            // Don't redirect if the 401 came from the login endpoint itself —
            // let the mutation's onError handler show the "wrong credentials" toast.
            if (!isLoginRequest && typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                // Redirect to login page (use absolute path to avoid double /auth)
                window.location.href = '/auth/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;

