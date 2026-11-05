import { apiRequest } from "@/services/api-client";
import { clearAuthSession, markAuthSession } from "@/services/auth-storage";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  handle?: string | null;
  avatarKey?: string | null;
}

interface AuthSession {
  user: AuthUser;
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

function adoptSession(session: AuthSession, remember: boolean): AuthUser {
  markAuthSession(remember);
  return session.user;
}

export async function register(
  name: string,
  email: string,
  password: string,
  remember = true,
): Promise<AuthUser> {
  const session = await apiRequest<AuthSession>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, remember }),
  });

  return adoptSession(session, remember);
}

export async function login(
  email: string,
  password: string,
  remember: boolean,
): Promise<AuthUser> {
  const session = await apiRequest<AuthSession>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, remember }),
  });

  return adoptSession(session, remember);
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

export async function updateProfile(
  name: string,
  handle: string,
  avatarKey: string,
): Promise<AuthUser> {
  return apiRequest<AuthUser>("/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify({ name, handle, avatarKey }),
  });
}

export async function logout(): Promise<void> {
  // Só apagar o indicador local após o servidor encerrar o cookie da sessão.
  // Em uma falha de rede, não afirmar que a pessoa saiu da conta.
  await apiRequest<void>("/api/auth/logout", { method: "POST" });
  clearAuthSession();
}
