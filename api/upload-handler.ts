import { Hono } from "hono";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as cookie from "cookie";
import { verifySessionToken } from "./lib/session";
import { Session } from "@contracts/constants";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

// Extensões e Mime-types aceitos para cada tipo de upload (segurança sanitária de arquivos)
const ALLOWED_TYPES = {
  avatar: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  event: ["image/jpeg", "image/png", "image/webp"],
  gallery: ["image/jpeg", "image/png", "image/webp"],
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // Tamanho máximo: 5MB

export const uploadApp = new Hono();

// Rota POST dedicada para uploads de arquivos baseado no tipo (avatar, event, gallery)
uploadApp.post("/api/upload/:type", async (c) => {
  const type = c.req.param("type") as keyof typeof ALLOWED_TYPES;
  if (!ALLOWED_TYPES[type]) {
    return c.json({ error: "Tipo de upload inválido" }, 400);
  }

  // Verifica a autenticação do usuário extraindo o token dos cookies
  const cookies = cookie.parse(c.req.header("Cookie") ?? "");
  const token = cookies[Session.cookieName];

  if (!token) {
    return c.json({ error: "Não autorizado" }, 401);
  }

  let session;
  try {
    session = await verifySessionToken(token);
  } catch {
    return c.json({ error: "Token inválido" }, 401);
  }

  if (!session) {
    return c.json({ error: "Token inválido" }, 401);
  }

  // Analisa o corpo da requisição multipart/form-data
  const body = await c.req.parseBody();
  const file = body["file"];

  if (!file || typeof file === "string") {
    return c.json({ error: "Nenhum arquivo enviado" }, 400);
  }

  // Valida o mime-type do arquivo para mitigar injeção de executáveis ou HTML prejudicial
  if (!ALLOWED_TYPES[type].includes(file.type)) {
    return c.json({ error: `Tipo de arquivo não permitido: ${file.type}` }, 400);
  }

  // Valida o tamanho do arquivo
  if (file.size > MAX_FILE_SIZE) {
    return c.json({ error: "Arquivo muito grande (máximo 5MB)" }, 400);
  }

  // Sanitiza o nome do arquivo removendo caracteres especiais e evitando Directory Traversal
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniqueName = `${session.userId}_${Date.now()}_${safeName}`;
  const subDir = type === "avatar" ? "avatars" : type === "event" ? "events" : "gallery";
  const uploadDir = path.join(UPLOAD_DIR, subDir);
  const filePath = path.join(uploadDir, uniqueName);

  // Cria a pasta de upload se ela ainda não existir
  await fs.mkdir(uploadDir, { recursive: true });

  // Converte o arquivo recebido para Buffer e escreve no disco local de forma assíncrona
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  const resultUrl = `/uploads/${subDir}/${uniqueName}`;

  return c.json({ url: resultUrl, success: true });
});
