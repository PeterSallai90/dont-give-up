import { defineConfig } from "vite";

// base "./" keeps every asset path relative, so the same build runs from the
// GitHub Pages root, from a pull request preview folder and inside Capacitor.
export default defineConfig({
  base: "./",
  build: { target: "es2022", sourcemap: true },
});
