import type { Hono } from "hono";
import type { HttpBindings } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs";
import path from "path";

type App = Hono<{ Bindings: HttpBindings }>;

// Configura o Hono para servir os arquivos estáticos compilados do frontend (Vite)
export function serveStaticFiles(app: App) {
  const distPath = path.resolve(import.meta.dirname, "../dist/public");

  // Serve arquivos de uploads locais da pasta uploads/
  app.use("/uploads/*", serveStatic({ root: "." }));
  // Serve os assets e arquivos estáticos da pasta dist/public
  app.use("*", serveStatic({ root: "./dist/public" }));

  // Fallback para comportamento Single Page Application (SPA), direcionando rotas não encontradas para o index.html
  app.notFound((c) => {
    const accept = c.req.header("accept") ?? "";
    // Se a requisição não aceitar HTML (como chamadas de API), retorna erro JSON 404 comum
    if (!accept.includes("text/html")) {
      return c.json({ error: "Não encontrado" }, 404);
    }
    const indexPath = path.resolve(distPath, "index.html");
    const content = fs.readFileSync(indexPath, "utf-8");
    return c.html(content);
  });
}
