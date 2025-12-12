import { JwtPayload } from "../types/index";

export const tokenStorage = {
	get: (): string | null => {
		if (typeof window === "undefined") return null;
		return localStorage.getItem("token");
	},

	set: (token: string): void => {
		if (typeof window === "undefined") return;
		localStorage.setItem("token", token);
	},

	remove: (): void => {
		if (typeof window === "undefined") return;
		localStorage.removeItem("token");
	},

	isValid: (token: string): boolean => {
		try {
			const payload = JSON.parse(atob(token.split(".")[1])) as JwtPayload;
			return payload.exp ? payload.exp * 1000 > Date.now() : true;
		} catch {
			return false;
		}
	},

	parseUser: (token: string) => {
		try {
			const payload = JSON.parse(atob(token.split(".")[1])) as JwtPayload;
			return {
				_id: payload.sub,
				email: payload.email,
				role: payload.role,
				profileCompleted: payload.profileCompleted,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
		} catch {
			return null;
		}
	},
};
