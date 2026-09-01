import { beforeEach, describe, expect, it, vi } from "vitest";

const apiRequestMock = vi.fn();

vi.mock("@/services/api-client", () => ({
  apiRequest: apiRequestMock,
}));

import { submitRecipe } from "@/services/recipe-submissions.service";

describe("recipe submissions service", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    apiRequestMock.mockResolvedValue({ message: "ok" });
  });

  it("envia campos e foto usando FormData", async () => {
    const image = new File(["image"], "bolo.jpg", { type: "image/jpeg" });

    await submitRecipe({
      authorName: "Maria",
      title: "Bolo",
      description: "Um bolo simples e gostoso.",
      ingredients: ["2 ovos", "1 xícara de farinha"],
      instructions: ["Misture tudo", "Leve ao forno"],
      difficulty: "FACIL",
      prepMinutes: 40,
      servings: 8,
      image,
    });

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    const [path, init] = apiRequestMock.mock.calls[0];
    expect(path).toBe("/api/recipe-submissions");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);

    const body = init.body as FormData;
    expect(body.get("authorName")).toBe("Maria");
    expect(body.getAll("ingredients")).toEqual(["2 ovos", "1 xícara de farinha"]);
    expect(body.get("image")).toBe(image);
  });
});
