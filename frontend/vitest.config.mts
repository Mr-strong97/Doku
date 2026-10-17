import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/** Tests unitaires et de composants : navigateur simulé (jsdom) + IndexedDB simulée (voir vitest.setup.ts). */
export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true }, // comprend l'alias « @/ » du tsconfig (plus besoin de vite-tsconfig-paths)
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
