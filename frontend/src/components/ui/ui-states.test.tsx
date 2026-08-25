import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./Button";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";
import { SectionTitle } from "./SectionTitle";

describe("Button", () => {
  it("usa type button por padrão e preserva propriedades nativas", () => {
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Salvar</Button>);

    const button = screen.getByRole("button", { name: "Salvar" });
    expect(button).toHaveAttribute("type", "button");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("permite definir o tipo submit", () => {
    render(<Button type="submit">Entrar</Button>);
    expect(screen.getByRole("button", { name: "Entrar" })).toHaveAttribute("type", "submit");
  });
});

describe("LoadingState", () => {
  it("expõe status acessível com o texto padrão", () => {
    render(<LoadingState />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando receitas…");
  });

  it("aceita um texto específico para a operação", () => {
    render(<LoadingState label="Carregando sua despensa…" />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando sua despensa…");
  });
});

describe("ErrorState", () => {
  it("mostra título e mensagem padrão como alerta", () => {
    render(<ErrorState />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("A cozinha ficou fora do ar");
    expect(alert).toHaveTextContent("Não foi possível buscar receitas agora. Tente novamente.");
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });

  it("executa a tentativa novamente quando a ação é fornecida", () => {
    const onRetry = vi.fn();

    render(
      <ErrorState
        message="Falha ao carregar a despensa."
        onRetry={onRetry}
        title="Não conseguimos abrir sua despensa"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Falha ao carregar a despensa.");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("EmptyState", () => {
  it("renderiza conteúdo vazio com ícone padrão", () => {
    render(<EmptyState description="Nenhuma receita salva." title="Sem favoritos" />);

    expect(screen.getByRole("heading", { name: "Sem favoritos" })).toBeInTheDocument();
    expect(screen.getByText("Nenhuma receita salva.")).toBeInTheDocument();
  });

  it("aceita ícone e ação personalizados", () => {
    render(
      <EmptyState
        action={<Button>Explorar receitas</Button>}
        description="Sua despensa ainda está vazia."
        icon="🥕"
        title="Comece pela despensa"
      />,
    );

    expect(screen.getByRole("button", { name: "Explorar receitas" })).toBeInTheDocument();
  });
});

describe("SectionTitle", () => {
  it("renderiza título, eyebrow e descrição", () => {
    render(
      <SectionTitle description="Receitas escolhidas para hoje" eyebrow="Em destaque">
        Mais populares
      </SectionTitle>,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Mais populares" })).toBeInTheDocument();
    expect(screen.getByText("Em destaque")).toBeInTheDocument();
    expect(screen.getByText("Receitas escolhidas para hoje")).toBeInTheDocument();
  });

  it("permite mudar o elemento semântico do título", () => {
    render(<SectionTitle as="h3">Comentários recentes</SectionTitle>);
    expect(screen.getByRole("heading", { level: 3, name: "Comentários recentes" })).toBeInTheDocument();
  });
});
