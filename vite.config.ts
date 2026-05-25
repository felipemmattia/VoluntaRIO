import devServer from "@hono/vite-dev-server"
import path from "path"
const __dirname = import.meta.dirname
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// Configuração oficial do Vite: https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Acopla o servidor de desenvolvimento do Hono para rodar a API localmente
    devServer({ entry: "api/boot.ts", exclude: [/^\/(?!api\/).*$/] }),
    react() // Plugin oficial para suporte ao React (JSX/Fast Refresh)
  ],
  server: {
    port: 3000,
    host: "0.0.0.0",
  },
  resolve: {
    alias: {
      // Configura aliases de caminho para simplificar imports no projeto
      "@": path.resolve(__dirname, "./src"),
      "@contracts": path.resolve(__dirname, "./contracts"),
      "@db": path.resolve(__dirname, "./db"),
      "db": path.resolve(__dirname, "./db"),
    },
  },
  envDir: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, "dist/public"), // Diretório de saída do build do frontend
    emptyOutDir: true, // Limpa a pasta de saída antes de cada build
  },
});
