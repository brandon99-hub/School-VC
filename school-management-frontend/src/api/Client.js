import axios from 'axios';

// Create a custom hook to access navigate (since interceptors can't directly use hooks)
const navigateToLogin = () => {
    if (typeof window !== 'undefined') {
        window.location.href = '/login'; // Fallback for non-React context
    }
};

const client = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Request interceptor for JWT
client.interceptors.request.use(
    config => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for token refresh
client.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        // Only attempt refresh if it's a 401 error, token exists, and refresh token is available
        if (
            error.response?.status === 401 &&
            localStorage.getItem('access_token') &&
            localStorage.getItem('refresh_token') &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;
            try {
                console.log('Attempting token refresh...');
                const refreshResponse = await axios.post(
                    `${client.defaults.baseURL}/api/auth/refresh/`,
                    { refresh: localStorage.getItem('refresh_token') },
                    { headers: { 'Content-Type': 'application/json' } }
                );
                const newToken = refreshResponse.data.access;
                localStorage.setItem('access_token', newToken);
                console.log('Token refreshed successfully:', newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return client(originalRequest);
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError.response?.data || refreshError.message);
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                navigateToLogin(); // Redirect to login page
                return Promise.reject(refreshError);
            }
        }

        // Log the error for debugging
        console.error('API request failed:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        // REMOVED THE 403/404 REDIRECT LOGIC
        // Let the error propagate to the component for handling
        return Promise.reject(error);
    }
);

export default client;