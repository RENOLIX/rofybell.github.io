import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/rofybell.github.io/",
  plugins: [react(), tailwindcss()],
});
