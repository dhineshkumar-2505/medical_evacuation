import { supabase } from './supabaseClient';

const API_URL = 'http://localhost:3001/api';

/**
 * API client with 3-second hard timeout
 */
export const api = {
    request: async (endpoint, options = {}) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                    ...options.headers,
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.warn(`API ${endpoint}: HTTP ${response.status}`);
                return { data: [], count: 0 };
            }

            const json = await response.json();
            return json;

        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                console.warn(`API ${endpoint}: Timeout (3s)`);
            } else {
                console.error(`API ${endpoint}:`, error.message);
            }
            return { data: [], count: 0 };
        }
    },

    get: (endpoint) => api.request(endpoint, { method: 'GET' }),

    post: (endpoint, body) => api.request(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
    }),

    patch: (endpoint, body) => api.request(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(body),
    }),

    delete: (endpoint) => api.request(endpoint, { method: 'DELETE' }),
};
