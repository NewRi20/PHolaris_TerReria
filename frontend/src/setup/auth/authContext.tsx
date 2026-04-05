import {
	createContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";

export type AuthRole = "teacher" | "admin";

export interface AuthUser {
	id: string;
	email: string;
	full_name: string | null;
	role: AuthRole;
	is_active: boolean;
}

export interface AuthTokens {
	access_token: string;
	refresh_token: string;
	token_type?: string;
}

export interface RegisterRequest {
	email: string;
	password: string;
	full_name: string;
}

export interface LoginRequest {
	identifier: string;
	password: string;
}

export interface RefreshRequest {
	refresh_token: string;
}

interface AuthContextType {
	user: AuthUser | null;
	accessToken: string | null;
	refreshToken: string | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (body: LoginRequest) => Promise<AuthTokens>;
	register: (body: RegisterRequest) => Promise<AuthTokens>;
	refresh: () => Promise<AuthTokens | null>;
	logout: () => void;
	setUser: (user: AuthUser | null) => void;
	setAuthTokens: (tokens: AuthTokens) => void;
}

const ACCESS_TOKEN_KEY = "pholaris_access_token";
const REFRESH_TOKEN_KEY = "pholaris_refresh_token";
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

const authInitialState = {
	user: null,
	accessToken: null,
	refreshToken: null,
	isAuthenticated: false,
	isLoading: true,
};

export const authContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<AuthUser | null>(authInitialState.user);
	const [accessToken, setAccessToken] = useState<string | null>(() => {
		if (typeof window === "undefined") {
			return authInitialState.accessToken;
		}

		return window.localStorage.getItem(ACCESS_TOKEN_KEY);
	});
	const [refreshToken, setRefreshToken] = useState<string | null>(() => {
		if (typeof window === "undefined") {
			return authInitialState.refreshToken;
		}

		return window.localStorage.getItem(REFRESH_TOKEN_KEY);
	});
	const [isLoading, setIsLoading] = useState<boolean>(authInitialState.isLoading);

	const persistTokens = (tokens: AuthTokens) => {
		setAccessToken(tokens.access_token);
		setRefreshToken(tokens.refresh_token);

		window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
		window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
	};

	const clearAuth = () => {
		setUser(null);
		setAccessToken(null);
		setRefreshToken(null);

		window.localStorage.removeItem(ACCESS_TOKEN_KEY);
		window.localStorage.removeItem(REFRESH_TOKEN_KEY);
	};

	const requestJson = async <T,>(path: string, init?: RequestInit): Promise<T> => {
		const response = await fetch(`${API_BASE_URL}${path}`, {
			...init,
			headers: {
				"Content-Type": "application/json",
				...(init?.headers ?? {}),
			},
		});

		if (!response.ok) {
			let message = "Authentication request failed";

			try {
				const payload = await response.json();
				if (typeof payload?.detail === "string") {
					message = payload.detail;
				}
			} catch {
				message = response.statusText || message;
			}

			throw new Error(message);
		}

		return (await response.json()) as T;
	};

	const fetchCurrentUser = async (token: string) => {
		const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			throw new Error("Failed to load authenticated user");
		}

		return (await response.json()) as AuthUser;
	};

	const applySession = async (tokens: AuthTokens) => {
		persistTokens(tokens);
		const currentUser = await fetchCurrentUser(tokens.access_token);
		setUser(currentUser);
		return tokens;
	};

	const login = async (body: LoginRequest) => {
		const tokens = await requestJson<AuthTokens>("/api/auth/login", {
			method: "POST",
			body: JSON.stringify(body),
		});

		return applySession(tokens);
	};

	const register = async (body: RegisterRequest) => {
		const tokens = await requestJson<AuthTokens>("/api/auth/register", {
			method: "POST",
			body: JSON.stringify(body),
		});

		return applySession(tokens);
	};

	const refresh = async () => {
		if (!refreshToken) {
			return null;
		}

		const tokens = await requestJson<AuthTokens>("/api/auth/refresh", {
			method: "POST",
			body: JSON.stringify({ refresh_token: refreshToken } satisfies RefreshRequest),
		});

		await applySession(tokens);
		return tokens;
	};

	const logout = () => {
		clearAuth();
	};

	useEffect(() => {
		const hydrateAuth = async () => {
			if (!accessToken && !refreshToken) {
				setIsLoading(false);
				return;
			}

			try {
				if (accessToken) {
					const currentUser = await fetchCurrentUser(accessToken);
					setUser(currentUser);
					setIsLoading(false);
					return;
				}

				await refresh();
			} catch {
				if (refreshToken) {
					try {
						await refresh();
						return;
					} catch {
						clearAuth();
					}
				} else {
					clearAuth();
				}
			} finally {
				setIsLoading(false);
			}
		};

		void hydrateAuth();
	}, [accessToken, refreshToken]);

	return (
		<authContext.Provider
			value={{
				user,
				accessToken,
				refreshToken,
				isAuthenticated: Boolean(user && accessToken),
				isLoading,
				login,
				register,
				refresh,
				logout,
				setUser,
				setAuthTokens: persistTokens,
			}}
		>
			{children}
		</authContext.Provider>
	);
};
