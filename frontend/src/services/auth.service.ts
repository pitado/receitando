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

interface ForgotPasswordResponse {
  message: string;
  resetId: string;
}

interface VerifyResetCodeResponse {
  resetToken: string;
}

interface ResetPasswordResponse {
  message: string;
}

export async function register(
  name: string,
  email: string,
  password: string,
  remember = true,
): Promise<AuthUser> {
  const session = await apiRequest<AuthSession>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });

  saveAuthToken(session.token, remember);
  return session.user;
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

export function requestPasswordReset(email: string): Promise<ForgotPasswordResponse> {
  return apiRequest<ForgotPasswordResponse>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function verifyPasswordResetCode(
  resetId: string,
  code: string,
): Promise<VerifyResetCodeResponse> {
  return apiRequest<VerifyResetCodeResponse>("/api/auth/verify-reset-code", {
    method: "POST",
    body: JSON.stringify({ resetId, code }),
  });
}

export function resetPassword(
  resetId: string,
  resetToken: string,
  password: string,
): Promise<ResetPasswordResponse> {
  return apiRequest<ResetPasswordResponse>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ resetId, resetToken, password }),
  });
}

export async function getCurrentUser(): Promise<AuthUser> {
  return apiRequest<AuthUser>("/api/auth/me");
}

export async function logout(): Promise<void> {
  try {
    await apiRequest<void>("/api/auth/logout", { method: "POST" });
  } finally {
    clearAuthToken();
  }
}
