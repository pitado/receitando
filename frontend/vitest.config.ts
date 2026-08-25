import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      include: [
        "src/lib/**/*.ts",
        "src/services/api-client.ts",
        "src/services/auth-storage.ts",
        "src/services/recipes.service.ts",
        "src/services/pantry.service.ts",
        "src/services/favorites.service.ts",
        "src/components/ui/Button.tsx",
        "src/components/ui/LoadingState.tsx",
        "src/components/ui/ErrorState.tsx",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        statements: 70,
        branches: 60,
      },
    },
  },
});
