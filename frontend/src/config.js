// Backend API Configuration
// Uses REACT_APP_BACKEND_URL or VITE_BACKEND_URL environment variable if available
// Falls back to Render deployment URL
// Note: For Vite projects, use VITE_BACKEND_URL (Vite only exposes VITE_ prefixed vars)
const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || 
                     import.meta.env.VITE_BACKEND_URL || 
                     'https://nutrivision-ai.onrender.com';

export const BASE_URL = `${BACKEND_URL}/api`;

