import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CookingRoomPage from "./page";

type RoomState = {
  recipeSlug: string;
  title: string;
  steps: string[];
  completed: boolean[];
  version: number;
  onlineCount: number;
};

const mock = vi.hoisted(() => ({
  callbacks: null as null | {
    onRoom: (room: RoomState) => void;
    onStatus: (status: "connecting" | "connected" | "offline" | "retrying" | "unavailable", message: string) => void;
  },
  setStep: vi.fn(),
  retry: vi.fn(),
  dispose: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "11111111-1111-4111-8111-111111111111" }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.PropsWithChildren<{ href: string; className?: string }>) =>
    <a href={href} {...props}>{children}</a>,
}));

vi.mock("@/services/cooking-room-connection", () => ({
  CookingRoomConnection: class {
    constructor(_id: string, callbacks: NonNullable<typeof mock.callbacks>) {
      mock.callbacks = callbacks;
    }
    setStep = mock.setStep;
    retry = mock.retry;
    dispose = mock.dispose;
  },
}));

vi.mock("@/services/recipes.service", () => ({
  getRecipeBySlug: vi.fn().mockRejectedValue(new Error("Sem catálogo no teste")),
}));

const room: RoomState = {
  recipeSlug: "bolinho-de-chuva",
  title: "Bolinho de chuva",
  steps: ["Misture os ingredientes.", "Asse por 5 minutos.", "Sirva ainda quente."],
  completed: [false, false, false],
  onlineCount: 2,
  version: 0,
};

function showRoom(state: RoomState = room) {
  act(() => {
    mock.callbacks?.onRoom(state);
    mock.callbacks?.onStatus("connected", "Conectado");
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mock.callbacks = null;
});

describe("Cozinhar junto — experiência guiada", () => {
  it("mostra carregamento enquanto não existe estado confirmado", () => {
    render(<CookingRoomPage />);
    expect(screen.getByRole("heading", { name: "Preparando sua cozinha..." })).toBeInTheDocument();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });

  it("mantém 3 checkboxes controlados e progresso confirmado pelo backend", () => {
    render(<CookingRoomPage />);
    showRoom();
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
    expect(screen.getByText("Progresso: 0 de 3 etapas concluídas")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Concluir esta etapa" }));
    expect(mock.setStep).toHaveBeenCalledWith(0, true);
    expect(screen.getByText("Progresso: 0 de 3 etapas concluídas")).toBeInTheDocument();

    showRoom({ ...room, version: 1, completed: [true, false, false] });
    expect(screen.getByRole("checkbox", { name: /Concluir etapa 1:/ })).toBeChecked();
    expect(screen.getByText("Progresso: 1 de 3 etapas concluídas")).toBeInTheDocument();
  });

  it("permite selecionar outro passo sem modificar os dados da sala", () => {
    render(<CookingRoomPage />);
    showRoom();
    fireEvent.click(screen.getByRole("button", { name: "Próxima etapa" }));
    expect(screen.getByText("PASSO 02 / 03")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Asse por 5 minutos." })).toBeInTheDocument();
    expect(mock.setStep).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Concluir esta etapa" }));
    expect(mock.setStep).toHaveBeenCalledWith(1, true);
    fireEvent.click(screen.getByRole("button", { name: "Etapa anterior" }));
    expect(screen.getByText("PASSO 01 / 03")).toBeInTheDocument();
  });

  it("desabilita ações offline e libera a recuperação manual", () => {
    render(<CookingRoomPage />);
    showRoom();
    act(() => mock.callbacks?.onStatus("offline", "Sem internet"));
    expect(screen.getByRole("button", { name: "Concluir esta etapa" })).toBeDisabled();
    expect(screen.getAllByRole("checkbox")[0]).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Tentar reconectar" }));
    expect(mock.retry).toHaveBeenCalledOnce();
  });

  it("oferece timer sugerido pelo texto, sem modificar a receita", () => {
    render(<CookingRoomPage />);
    showRoom();
    fireEvent.click(screen.getByRole("button", { name: "Próxima etapa" }));
    fireEvent.click(screen.getByRole("button", { name: /Iniciar timer sugerido de 5 min/ }));
    expect(screen.getByRole("timer")).toHaveTextContent("05:00");
    expect(mock.setStep).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Pausar" }));
    fireEvent.click(screen.getByRole("button", { name: "Zerar" }));
    expect(screen.getByRole("timer")).toHaveTextContent("00:00");
  });

  it("oferece o link para cópia manual quando a área de transferência está indisponível", async () => {
    render(<CookingRoomPage />);
    showRoom();
    fireEvent.click(screen.getByRole("button", { name: /Convidar alguém/ }));
    expect(screen.getByRole("heading", { name: "Traga mais alguém para a receita" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Link do convite" })).toHaveAttribute("readonly"));
    expect(screen.getByRole("alert")).toHaveTextContent("copie o link acima");
  });

  it("mostra estado final quando todos concluíram a receita", () => {
    render(<CookingRoomPage />);
    showRoom({ ...room, completed: [true, true, true], version: 3 });
    expect(screen.getByText("Progresso: 3 de 3 etapas concluídas")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Da nossa cozinha para a mesa!" })).toBeInTheDocument();
  });
});
