import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor to attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for 401/403 error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Candidate API functions
export const candidatesApi = {
  getAll: async (filters?: any) => {
    const response = await api.get('/candidates', { params: filters });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/candidates/${id}`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/candidates/${id}`);
    return response.data;
  },

  toggleShortlist: async (id: string) => {
    const response = await api.patch(`/candidates/${id}/shortlist`);
    return response.data;
  },
};

// Auth API functions
export const authApi = {
  forgotPassword: async (email: string) => {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`,
      { email }
    );
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password/${token}`,
      { newPassword }
    );
    return response.data;
  },
};

// Dashboard API functions
export const dashboardApi = {
  getAdminMetrics: async () => {
    const response = await api.get('/dashboard/admin');
    return response.data;
  },
};

// Error Logs API functions
export const errorLogsApi = {
  getAll: async (filters?: any) => {
    const response = await api.get('/admin/error-logs', { params: filters });
    return response.data;
  },
};

// Audit Logs API functions
export const auditLogsApi = {
  getAll: async (filters?: any) => {
    const response = await api.get('/admin/audit-logs', { params: filters });
    return response.data;
  },
};

export default api;