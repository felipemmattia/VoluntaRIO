import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { uploadApp } from "./upload-handler";

// Inicializa a instância do servidor Hono configurado com bindings HTTP para Node.js
const app = new Hono<{ Bindings: HttpBindings }>();

// Define o limite máximo para o corpo das requisições (ex: uploads de imagens de até 50MB)
app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// Acopla a aplicação auxiliar de upload de arquivos na raiz
app.route("/", uploadApp);

// Configura o middleware para processar requisições do tRPC
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

// Retorna erro 404 estruturado caso alguma rota /api/ não seja mapeada acima
app.all("/api/*", (c) => c.json({ error: "Rota não encontrada" }, 404));

export default app;

// Caso esteja rodando em modo de produção, inicia o servidor na porta especificada e serve os arquivos estáticos compilados
if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Servidor rodando em http://localhost:${port}/`);
  });
}
