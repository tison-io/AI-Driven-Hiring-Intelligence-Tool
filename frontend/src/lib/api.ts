// @ts-ignore
import axios from "axios";
import { CandidateFilters } from "@/types";
import { AnalyticsData } from "@/types/dashboard";

// Create axios instance with base configuration
const api = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL,
	headers: {
		"Content-Type": "application/json",
	},
	timeout: 30000, // 30 seconds timeout - increased for large datasets
	withCredentials: true, // Enable cookies for JWT authentication
});

// Response interceptor to tag auth errors
api.interceptors.response.use(
	(response: any) => response,
	(error: any) => {
		// Tag auth errors for components to handle
		if (error.response?.status === 401 || error.response?.status === 403) {
			error.isAuthError = true;
		}
		return Promise.reject(error);
	},
);

// Candidate API functions
export const candidatesApi = {
	getAll: async (filters?: CandidateFilters) => {
		const response = await api.get("/api/candidates", { params: filters });
		return response.data;
	},

	getById: async (id: string) => {
		const response = await api.get(`/api/candidates/${id}`);
		return response.data;
	},

	delete: async (id: string) => {
		const response = await api.delete(`/api/candidates/${id}`);
		return response.data;
	},

	toggleShortlist: async (id: string) => {
		const response = await api.patch(`/api/candidates/${id}/shortlist`);
		return response.data;
	},

	getFilterOptions: async () => {
		const response = await api.get('/api/candidates/filter-options');
		return response.data;
	},
};

// Auth API functions
export const authApi = {
	validateSession: async () => {
		const response = await api.get("/auth/session/validate", {
			withCredentials: true,
		});
		return response.data;
	},

	forgotPassword: async (email: string) => {
		const response = await api.post("/auth/forgot-password", { email });
		return response.data;
	},

	resetPassword: async (token: string, newPassword: string) => {
		const response = await api.post(`/auth/reset-password/${token}`, {
			newPassword,
		});
		return response.data;
	},

	verifyEmail: async (email: string, code: string) => {
		const response = await api.post('/auth/verify-email', { email, code });
		return response.data;
	},

	resendVerificationCode: async (email: string) => {
		const response = await api.post('/auth/resend-verification', { email });
		return response.data;
	},
};

// Dashboard API functions
export const dashboardApi = {
	getAdminMetrics: async () => {
		const response = await api.get("/api/dashboard/admin");
		return response.data;
	},
	getAnalytics: async (): Promise<AnalyticsData> => {
		const response = await api.get("/api/dashboard/analytics");
		return response.data;
	},
	getAIPerformanceMetrics: async () => {
		const response = await api.get("/api/dashboard/admin/ai-performance");
		return response.data;
	},
};

// Error Logs API functions
export const errorLogsApi = {
	getAll: async (filters?: Record<string, any>) => {
		const response = await api.get("/api/admin/error-logs", {
			params: filters,
		});
		return response.data;
	},
};

// Audit Logs API functions
export const auditLogsApi = {
	getAll: async (filters?: Record<string, any>) => {
		const response = await api.get("/api/admin/audit-logs", {
			params: filters,
		});
		return response.data;
	},
};

// Job Postings API functions
export const jobPostingsApi = {
	getByToken: async (token: string) => {
		const response = await api.get(`/api/job-postings/apply/${token}`);
		return response.data;
	},
	submitApplication: async (token: string, formData: FormData) => {
		const response = await api.post(`/api/job-postings/apply/${token}`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	},
};

export default api;
