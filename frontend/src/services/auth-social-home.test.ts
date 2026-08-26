import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/api-client", () => ({
  apiRequest: vi.fn(),
  setTransientBearerToken: vi.fn(),
}));
vi.mock("@/services/auth-storage", () => ({
  markAuthSession: vi.fn(),
  clearAuthSession: vi.fn(),
}));

import { apiRequest, setTransientBearerToken } from "@/services/api-client";
import { clearAuthSession, markAuthSession } from "@/services/auth-storage";

import {
  getCurrentUser,
  login,
  logout,
  register,
  requestPasswordReset,
  resetPassword,
  updateProfile,
  verifyPasswordResetCode,
} from "./auth.service";
import { getHomeFeed } from "./home.service";
import {
  createRecipeComment,
  deleteRecipeComment,
  getRecipeSocial,
  listRecipeComments,
  removeRecipeVote,
  setRecipeVote,
  updateRecipeComment,
} from "./recipe-social.service";

const apiRequestMock = vi.mocked(apiRequest);
const setTransientBearerTokenMock = vi.mocked(setTransientBearerToken);
const markAuthSessionMock = vi.mocked(markAuthSession);
const clearAuthSessionMock = vi.mocked(clearAuthSession);

const user = {
  id: "user-1",
  name: "Pessoa Teste",
  email: "pessoa@example.com",
  role: "USER" as const,
};

const session = {
  user,
  expiresAt: "2026-09-25T00:00:00.000Z",
};

describe("auth.service", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    setTransientBearerTokenMock.mockReset();
    markAuthSessionMock.mockReset();
    clearAuthSessionMock.mockReset();
  });

  it("registra usuário em modo cookie e devolve o perfil", async () => {
    apiRequestMock.mockResolvedValueOnce(session);

    await expect(register("Pessoa Teste", "pessoa@example.com", "senha-segura-123", false)).resolves.toEqual(user);

    expect(apiRequestMock).toHaveBeenCalledWith("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Pessoa Teste",
        email: "pessoa@example.com",
        password: "senha-segura-123",
        remember: false,
        authMode: "cookie-v1",
      }),
    });
    expect(setTransientBearerTokenMock).toHaveBeenCalledWith(null);
    expect(markAuthSessionMock).toHaveBeenCalledWith(false);
  });

  it("faz login em modo cookie e respeita a opção lembrar", async () => {
    apiRequestMock.mockResolvedValueOnce(session);

    await expect(login("pessoa@example.com", "senha-segura-123", true)).resolves.toEqual(user);
    expect(apiRequestMock).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "pessoa@example.com",
        password: "senha-segura-123",
        remember: true,
        authMode: "cookie-v1",
      }),
    });
    expect(setTransientBearerTokenMock).toHaveBeenCalledWith(null);
    expect(markAuthSessionMock).toHaveBeenCalledWith(true);
  });

  it("aceita token somente em memória se a API antiga responder durante o deploy", async () => {
    apiRequestMock.mockResolvedValueOnce({ ...session, token: "temporario" });

    await login("pessoa@example.com", "senha-segura-123", true);

    expect(setTransientBearerTokenMock).toHaveBeenCalledWith("temporario");
  });

  it("usa os contratos corretos de recuperação de senha", async () => {
    apiRequestMock
      .mockResolvedValueOnce({ message: "ok", resetId: "reset-1" })
      .mockResolvedValueOnce({ resetToken: "reset-token" })
      .mockResolvedValueOnce({ message: "Senha alterada" });

    await requestPasswordReset("pessoa@example.com");
    await verifyPasswordResetCode("reset-1", "123456");
    await resetPassword("reset-1", "reset-token", "nova-senha-123");

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: "pessoa@example.com" }),
    });
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/auth/verify-reset-code", {
      method: "POST",
      body: JSON.stringify({ resetId: "reset-1", code: "123456" }),
    });
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, "/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ resetId: "reset-1", resetToken: "reset-token", password: "nova-senha-123" }),
    });
  });

  it("consulta e atualiza o perfil atual", async () => {
    apiRequestMock.mockResolvedValue(user);

    await getCurrentUser();
    await updateProfile("Pessoa Nova", "pessoa_nova", "lemon");

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/auth/me");
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify({ name: "Pessoa Nova", handle: "pessoa_nova", avatarKey: "lemon" }),
    });
  });

  it("sempre limpa sessão e fallback ao sair, mesmo se a API falhar", async () => {
    apiRequestMock.mockRejectedValueOnce(new Error("API indisponível"));

    await expect(logout()).rejects.toThrow("API indisponível");
    expect(setTransientBearerTokenMock).toHaveBeenCalledWith(null);
    expect(clearAuthSessionMock).toHaveBeenCalledTimes(1);
  });
});

describe("recipe-social.service", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    apiRequestMock.mockResolvedValue([]);
  });

  it("consulta resumo, grava e remove voto com IDs escapados", async () => {
    await getRecipeSocial("recipe/1");
    await setRecipeVote("recipe/1", "LIKE");
    await removeRecipeVote("recipe/1");

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/recipes/recipe%2F1/social");
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/recipes/recipe%2F1/vote", {
      method: "PUT",
      body: JSON.stringify({ vote: "LIKE" }),
    });
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, "/api/recipes/recipe%2F1/vote", {
      method: "DELETE",
    });
  });

  it("lista, cria, edita e exclui comentários", async () => {
    await listRecipeComments("recipe/1");
    await createRecipeComment("recipe/1", "Gostei muito");
    await updateRecipeComment("comment/1", "Texto atualizado");
    await deleteRecipeComment("comment/1");

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/recipes/recipe%2F1/comments");
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/recipes/recipe%2F1/comments", {
      method: "POST",
      body: JSON.stringify({ body: "Gostei muito" }),
    });
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, "/api/recipe-comments/comment%2F1", {
      method: "PATCH",
      body: JSON.stringify({ body: "Texto atualizado" }),
    });
    expect(apiRequestMock).toHaveBeenNthCalledWith(4, "/api/recipe-comments/comment%2F1", {
      method: "DELETE",
    });
  });
});

describe("home.service", () => {
  it("consulta o feed da home pela rota pública", async () => {
    apiRequestMock.mockReset();
    apiRequestMock.mockResolvedValueOnce({ popular: [], recentComments: [], totals: { recipes: 0, comments: 0, likes: 0 } });

    await getHomeFeed();

    expect(apiRequestMock).toHaveBeenCalledWith("/api/home-feed");
  });
});
