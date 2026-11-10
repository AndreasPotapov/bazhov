import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Путь, по которому будет открываться сайт: username.github.io/bazhov/
  base: "/bazhov/",
});
