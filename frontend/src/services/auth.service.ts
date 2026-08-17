import { apiRequest } from "@/services/api-client";
import { clearAuthToken, saveAuthToken } from "@/services/auth-storage";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}

interface AuthSession {
  user: AuthUser;
  token: string;
  expiresAt: string;
}

export async function login(
  email: string,
  password: string,
  remember: boolean,
): Promise<AuthUser> {
  const session = await apiRequest<AuthSession>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  saveAuthToken(session.token, remember);
  return session.user;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest<void>("/api/auth/logout", { method: "POST" });
  } finally {
    clearAuthToken();
  }
}
