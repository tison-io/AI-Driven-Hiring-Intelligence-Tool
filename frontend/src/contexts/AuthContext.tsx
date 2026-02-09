"use client";

import { createContext, useState, useEffect, useContext, useRef } from "react";
import { usePathname } from "next/navigation";
import api from "../lib/api";
import { User, AuthContextType, AuthProviderProps } from "../types";

export const AuthContext = createContext<AuthContextType | undefined>(
	undefined,
);

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
	"/",
	"/auth/login",
	"/auth/register",
	"/auth/forgot-password",
	"/auth/verify-email",
];

const SEMI_PROTECTED_ROUTES = ["/complete-profile"];

export function AuthProvider({ children }: AuthProviderProps) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const isInitialized = useRef(false);
	const pathname = usePathname();

	useEffect(() => {
		const isPublicRoute =
			PUBLIC_ROUTES.includes(pathname) ||
			pathname.startsWith("/auth/reset-password");

		const isSemiProtectedRoute = SEMI_PROTECTED_ROUTES.includes(pathname);
		const checkAuth = async () => {
			// If we're on a public route, don't make auth calls
			if (isPublicRoute) {
				setLoading(false);
				isInitialized.current = true;
				return;
			}

			// On protected routes, verify authentication
			try {
				setLoading(true);
				const response = await api.get("/auth/profile");
				setUser(response.data);
			} catch (error: any) {
				setUser(null);
				// Handle auth errors by redirecting to login (client-side only)
				if (
					error.isAuthError &&
					typeof window !== "undefined" &&
					!isPublicRoute &&
					!isSemiProtectedRoute
				) {
					window.location.href = "/auth/login";
				}
			} finally {
				setLoading(false);
				isInitialized.current = true;
			}
		};

		checkAuth();
	}, [pathname]);

	const login = async (email: string, password: string) => {
		try {
			setError(null);
			setLoading(true);

			const response = await api.post("/auth/login", { email, password });

			// Use user data directly from login response
			setUser(response.data.user);
			return response.data.user;
		} catch (err: any) {
			const message =
				err.response?.data?.message ||
				(err instanceof Error ? err.message : "Login failed");
			setError(message);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const register = async (email: string, password: string) => {
		try {
			setError(null);
			setLoading(true);

			const response = await api.post("/auth/register", {
				email,
				password,
			});

			// Registration successful - no JWT issued yet
			// User must verify email first
			return response.data.user;
		} catch (err: any) {
			const message =
				err.response?.data?.message ||
				(err instanceof Error ? err.message : "Registration failed");
			setError(message);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const logout = async () => {
		try {
			// Backend clears cookie
			await api.post("/auth/logout");
		} catch (error) {
			console.error("Logout API call failed:", error);
		} finally {
			// Clear local state
			setUser(null);
			setError(null);
		}
	};

	const refreshUser = async () => {
		try {
			const response = await api.get("/auth/profile");
			setUser(response.data);
		} catch (error) {
			console.error("Failed to refresh user:", error);
			setUser(null);
		}
	};

	const verifyEmail = async (email: string, code: string) => {
		try {
			setError(null);
			setLoading(true);

			const response = await api.post('/auth/verify-email', { email, code });

			// Email verified successfully - JWT issued and cookie set
			setUser(response.data.user);
			return response.data.user;
		} catch (err: any) {
			const message =
				err.response?.data?.message ||
				(err instanceof Error ? err.message : "Verification failed");
			setError(message);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const resendVerificationCode = async (email: string) => {
		try {
			setError(null);

			const response = await api.post('/auth/resend-verification', { email });
			return response.data;
		} catch (err: any) {
			const message =
				err.response?.data?.message ||
				(err instanceof Error ? err.message : "Failed to resend code");
			setError(message);
			throw err;
		}
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				isInitialized: isInitialized.current,
				error,
				login,
				register,
				verifyEmail,
				resendVerificationCode,
				logout,
				refreshUser,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

// Custom hook to use auth context
export function useAuth() {
	const context = useContext(AuthContext);

	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}

	return context;
}
