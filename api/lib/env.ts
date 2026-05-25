import "dotenv/config";

// Função para validar se uma variável de ambiente obrigatória foi definida (usada principalmente em produção)
function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Variável de ambiente obrigatória não definida: ${name}`);
  }
  return value ?? "";
}

// Configurações globais centralizadas vindas das variáveis de ambiente (.env)
export const env = {
  appSecret: required("APP_SECRET"), // Segredo usado para assinar e validar os tokens JWT
  isProduction: process.env.NODE_ENV === "production", // Indica se a aplicação está rodando em ambiente de produção
  databaseUrl: required("DATABASE_URL"), // URL de conexão com o banco de dados (ex: MySQL/PostgreSQL/SQLite)
  adminEmail: process.env.ADMIN_EMAIL ?? "", // Email do administrador padrão
  resendApiKey: process.env.RESEND_API_KEY ?? "", // Chave de API do serviço Resend para envio de emails
  resendFromEmail: process.env.RESEND_FROM_EMAIL ?? "", // Email de remetente configurado no Resend
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000", // URL base do frontend da aplicação
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "", // Client ID do Google OAuth para login social
};
