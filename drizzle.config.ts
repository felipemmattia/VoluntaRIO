import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL é obrigatória para executar os comandos do drizzle");
}

// Configurações do Drizzle Kit para mapeamento de schema e migrações do banco de dados
export default defineConfig({
  schema: "./db/schema.ts", // Caminho das definições das tabelas
  out: "./db/migrations",   // Pasta de saída das migrações SQL geradas
  dialect: "mysql",          // Dialeto do banco (MySQL)
  dbCredentials: {
    url: connectionString,   // URL de conexão com as credenciais do banco
  },
});
