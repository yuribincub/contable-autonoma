// Configuración de conexión al backend
import axios from 'axios';

const getApiBaseUrl = () => {
    if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }

    if (typeof window !== 'undefined' && window.location) {
        const protocol = window.location.protocol;
        const hostname = process.env.REACT_APP_API_HOST || window.location.hostname;
        const port = process.env.REACT_APP_API_PORT || '3000';
        return `${protocol}//${hostname}:${port}`;
    }

    const host = process.env.REACT_APP_API_HOST || 'localhost';
    const port = process.env.REACT_APP_API_PORT || '3000';
    return `http://${host}:${port}`;
};

const api = axios.create({
    baseURL: getApiBaseUrl(),
});

export default api;