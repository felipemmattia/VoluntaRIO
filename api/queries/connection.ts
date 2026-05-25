// Configuração da conexão com o banco de dados MySQL via Drizzle ORM.
import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

// Mescla o schema do banco e as relações para que o Drizzle as reconheça globalmente
const fullSchema = { ...schema, ...relations };

// Instância singleton do banco de dados para evitar múltiplas conexões simultâneas
let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

// Retorna a conexão singleton ativa com o banco de dados
export function getDb() {
  if (!instance) {
    instance = drizzle(env.databaseUrl, {
      mode: "default",
      schema: fullSchema,
    });
  }
  return instance;
}

