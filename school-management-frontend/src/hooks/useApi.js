import { useCallback, useMemo } from 'react';
import api from '../api/Client';

export const useApi = () => {
    const request = useCallback(async (method, url, data = null, config = {}) => {
        try {
            const response = await api[method](url, data, config);
            return response.data;
        } catch (err) {
            const error = {
                message: err.message,
                response: {
                    status: err.response?.status,
                    data: err.response?.data || { detail: 'Network Error' },
                },
            };
            // Handle 401/403 errors globally
            if ([401, 403].includes(error.response?.status)) {
                window.location.href = '/login';
            }
            throw error;
        }
    }, []);

    return useMemo(() => ({
        get: (url, config) => request('get', url, null, config),
        post: (url, data, config) => request('post', url, data, config),
        put: (url, data, config) => request('put', url, data, config),
        delete: (url, config) => request('delete', url, null, config),
    }), [request]);
};