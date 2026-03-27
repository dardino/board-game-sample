import tsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsConfigPaths()],
  test: {
    testTimeout: 2_000, // Set a timeout for tests
    hookTimeout: 2_000, // Set a timeout for hooks like beforeEach
    teardownTimeout: 2_000, // Set a timeout for teardown hooks
    globals: true, // Enable global APIs like Jest
    environment: "node", // Set the test environment
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
    ], // Exclude specific files
    setupFiles: ["./test/setup.ts"], // Setup file to run before tests
    coverage: {
      reporter: [
        "text",
        "json",
        "html",
      ], // Coverage reporters
    },
    clearMocks: true, // Automatically clear mock calls and instances between every test
  },
});
