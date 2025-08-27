// API Configuration
const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api`;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    signup: `${API_BASE_URL}/auth/signup`,
    forgotPassword: `${API_BASE_URL}/auth/forgot-password`,
    resetPassword: `${API_BASE_URL}/auth/reset-password`,
    me: `${API_BASE_URL}/auth/me`,
    updateProfile: `${API_BASE_URL}/auth/update-profile`,
    verifyBand: `${API_BASE_URL}/auth/verify-band`,
    logout: `${API_BASE_URL}/auth/logout`
  },
  
  // Patient
  patient: {
    dashboard: (patientId) => `${API_BASE_URL}/patient/dashboard/${patientId}`,
    list: `${API_BASE_URL}/patient/list`,
    medications: (patientId) => `${API_BASE_URL}/patient/${patientId}/medications`
  },
  
  // Sensor
  sensor: {
    data: (patientId) => `${API_BASE_URL}/sensor/data/${patientId}`,
    latest: (patientId) => `${API_BASE_URL}/sensor/latest/${patientId}`,
    analytics: (patientId) => `${API_BASE_URL}/sensor/analytics/${patientId}`,
    manual: `${API_BASE_URL}/sensor/manual`,
    thingspeakStatus: `${API_BASE_URL}/sensor/thingspeak/status`
  },
  
  // Alerts
  alert: {
    patient: (patientId) => `${API_BASE_URL}/alert/patient/${patientId}`,
    active: `${API_BASE_URL}/alert/active`,
    acknowledge: (alertId) => `${API_BASE_URL}/alert/${alertId}/acknowledge`,
    resolve: (alertId) => `${API_BASE_URL}/alert/${alertId}/resolve`,
    escalate: (alertId) => `${API_BASE_URL}/alert/${alertId}/escalate`,
    create: `${API_BASE_URL}/alert/create`,
    statistics: `${API_BASE_URL}/alert/statistics`
  },
  
  // Reports
  report: {
    generate: `${API_BASE_URL}/report/generate`,
    patient: (patientId) => `${API_BASE_URL}/report/patient/${patientId}`,
    single: (reportId) => `${API_BASE_URL}/report/${reportId}`,
    notes: (reportId) => `${API_BASE_URL}/report/${reportId}/notes`,
    share: (reportId) => `${API_BASE_URL}/report/${reportId}/share`
  },
  
  // Health Check
  health: `${API_BASE_URL}/health`
};

// API Helper Functions
const createApiRequest = () => {
  const token = localStorage.getItem('token');
  
  const request = async (url: string, options: RequestInit = {}) => {
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${localStorage.getItem('token')}` })
      }
    };
    
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...(options.headers || {})
      }
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'API request failed' }));
      throw new Error(error.message || 'API request failed');
    }
    
    return response.json();
  };

  return {
    get: (url: string, options: RequestInit = {}) => 
      request(url, { ...options, method: 'GET' }),
    
    post: (url: string, data?: any, options: RequestInit = {}) =>
      request(url, {
        ...options,
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined
      }),
    
    put: (url: string, data?: any, options: RequestInit = {}) =>
      request(url, {
        ...options,
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined
      }),
    
    delete: (url: string, options: RequestInit = {}) =>
      request(url, { ...options, method: 'DELETE' }),
    
    // Legacy support
    request
  };
};

export const apiRequest = createApiRequest();

// Auth Helper
export const authHelper = {
  setToken: (token: string) => localStorage.setItem('token', token),
  getToken: () => localStorage.getItem('token'),
  removeToken: () => localStorage.removeItem('token'),
  setUser: (user: any) => localStorage.setItem('user', JSON.stringify(user)),
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  removeUser: () => localStorage.removeItem('user'),
  isAuthenticated: () => !!localStorage.getItem('token'),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export default API_ENDPOINTS;