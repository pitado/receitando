import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/services/api-client";
import type { PantryItem } from "@/services/pantry.service";

import { PantryClient } from "./PantryClient";

const pantry = vi.hoisted(() => ({
  getPantry: vi.fn(),
  getIngredients: vi.fn(),
  removePantryItem: vi.fn(),
  savePantryItem: vi.fn(),
  getHomeFeed: vi.fn(),
  matchRecipesFromPantry: vi.fn(),
}));

vi.mock("@/services/pantry.service", () => pantry);
vi.mock("@/services/auth-storage", () => ({ hasAuthSessionHint: () => true }));
vi.mock("@/services/home.service", () => ({ getHomeFeed: pantry.getHomeFeed }));
vi.mock("@/services/recipes.service", () => ({
  matchRecipesFromPantry: pantry.matchRecipesFromPantry,
}));

function item(id: string, ingredientId: string, name: string): PantryItem {
  return {
    id,
    quantity: 2,
    unit: "un",
    expiresAt: null,
    createdAt: "2026-11-19T00:00:00.000Z",
    updatedAt: "2026-11-19T00:00:00.000Z",
    ingredientId,
    ingredientName: name,
    normalizedName: name.toLowerCase(),
    category: "Outros",
  };
}

const ovo = item("item-ovo", "ing-ovo", "Ovo");
const leite = item("item-leite", "ing-leite", "Leite");

async function renderLoaded(initial: PantryItem[]) {
  pantry.getPantry.mockResolvedValue(initial);
  render(<PantryClient />);
  await screen.findByLabelText(`Remover ${initial[0].ingredientName}`);
}

describe("exclusão de itens da despensa", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    pantry.getIngredients.mockResolvedValue([]);
    pantry.getHomeFeed.mockResolvedValue({ totals: { recipes: 0 } });
    pantry.matchRecipesFromPantry.mockResolvedValue([]);
  });

  it("remove o item da lista e mostra o Desfazer", async () => {
    await renderLoaded([ovo, leite]);
    pantry.removePantryItem.mockResolvedValue([leite]);

    fireEvent.click(screen.getByLabelText("Remover Ovo"));

    await screen.findByText("foi removido.", { exact: false });
    expect(pantry.removePantryItem).toHaveBeenCalledExactlyOnceWith("item-ovo");
    expect(screen.queryByLabelText("Remover Ovo")).toBeNull();
    expect(screen.getByLabelText("Remover Leite")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Desfazer" })).toBeTruthy();
  });

  it("em caso de falha mantém a lista, mostra o erro e não oferece Desfazer", async () => {
    await renderLoaded([ovo, leite]);
    pantry.removePantryItem.mockRejectedValue(new ApiError("Falha no servidor.", "http", 500));

    fireEvent.click(screen.getByLabelText("Remover Ovo"));

    await screen.findByText("Falha no servidor.");
    expect(screen.getByLabelText("Remover Ovo")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Desfazer" })).toBeNull();
  });

  it("clique duplo envia apenas uma requisição de exclusão", async () => {
    await renderLoaded([ovo, leite]);
    let resolve!: (value: PantryItem[]) => void;
    pantry.removePantryItem.mockReturnValue(new Promise<PantryItem[]>((r) => (resolve = r)));

    const button = screen.getByLabelText("Remover Ovo");
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(screen.getByLabelText("Remover Leite"));

    expect(pantry.removePantryItem).toHaveBeenCalledTimes(1);
    resolve([leite]);
    await screen.findByText("foi removido.", { exact: false });
  });

  it("404 (já removido em outra aba) sincroniza a lista sem oferecer Desfazer", async () => {
    await renderLoaded([ovo, leite]);
    pantry.removePantryItem.mockRejectedValue(new ApiError("Não encontrado.", "http", 404));
    pantry.getPantry.mockResolvedValue([leite]);

    fireEvent.click(screen.getByLabelText("Remover Ovo"));

    await waitFor(() => expect(screen.queryByLabelText("Remover Ovo")).toBeNull());
    expect(screen.queryByRole("button", { name: "Desfazer" })).toBeNull();
  });

  it("Desfazer restaura o item uma única vez", async () => {
    await renderLoaded([ovo, leite]);
    pantry.removePantryItem.mockResolvedValue([leite]);
    pantry.savePantryItem.mockResolvedValue([ovo, leite]);

    fireEvent.click(screen.getByLabelText("Remover Ovo"));
    const undo = await screen.findByRole("button", { name: "Desfazer" });
    fireEvent.click(undo);
    fireEvent.click(undo);

    await waitFor(() => expect(screen.getByLabelText("Remover Ovo")).toBeTruthy());
    expect(pantry.savePantryItem).toHaveBeenCalledExactlyOnceWith("ing-ovo", 2, "un", null);
    expect(screen.queryByRole("button", { name: "Desfazer" })).toBeNull();
  });

  it("falha no Desfazer mantém a lista inalterada e o botão disponível", async () => {
    await renderLoaded([ovo, leite]);
    pantry.removePantryItem.mockResolvedValue([leite]);
    pantry.savePantryItem.mockRejectedValue(new ApiError("Falha ao restaurar.", "http", 500));

    fireEvent.click(screen.getByLabelText("Remover Ovo"));
    fireEvent.click(await screen.findByRole("button", { name: "Desfazer" }));

    await screen.findByText("Falha ao restaurar.");
    expect(screen.queryByLabelText("Remover Ovo")).toBeNull();
    expect(screen.getByRole("button", { name: "Desfazer" })).toBeTruthy();
  });
});
