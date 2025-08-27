import axios, { AxiosResponse, AxiosError } from 'axios';

// Base API configuration  
// Temporarily hardcoded for debugging
const BASE_URL = 'http://localhost:4000/api';

console.log('API Helper - Environment VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('API Helper - Computed BASE_URL:', BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Request interceptor - config.url:', config.url);
    console.log('Request interceptor - config.baseURL:', config.baseURL);
    console.log('Request interceptor - Full URL will be:', config.baseURL + config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle responses and errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Return the response data directly
    return response.data;
  },
  (error: AxiosError) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/sign-in';
    }
    
    // Return error in a consistent format
    return Promise.reject({
      status: error.response?.status,
      message: error.message,
      response: error.response,
      data: error.response?.data
    });
  }
);

// API helper methods
const apiHelper = {
  // GET request
  get: async (url: string, config?: any) => {
    return api.get(url, config);
  },

  // POST request
  post: async (url: string, data?: any, config?: any) => {
    return api.post(url, data, config);
  },

  // PUT request
  put: async (url: string, data?: any, config?: any) => {
    return api.put(url, data, config);
  },

  // DELETE request
  delete: async (url: string, config?: any) => {
    return api.delete(url, config);
  },

  // PATCH request
  patch: async (url: string, data?: any, config?: any) => {
    return api.patch(url, data, config);
  },

  // File upload
  upload: async (url: string, formData: FormData, config?: any) => {
    return api.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
  },

  // Set auth token
  setAuthToken: (token: string) => {
    localStorage.setItem('token', token);
  },

  // Remove auth token
  removeAuthToken: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Get auth headers
  getAuthHeaders: () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
};

export default apiHelper;