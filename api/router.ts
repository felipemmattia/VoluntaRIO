import { authRouter } from "./auth-router";
import { categoryRouter } from "./category-router";
import { ongRouter } from "./ong-router";
import { eventRouter } from "./event-router";
import { enrollmentRouter } from "./enrollment-router";
import { volunteerRouter } from "./volunteer-router";
import { notificationRouter } from "./notification-router";
import { messageRouter } from "./message-router";
import { uploadRouter } from "./upload-router";
import { adminRouter } from "./admin-router";
import { donationRouter } from "./donation-router";
import { certificateRouter } from "./certificate-router";
import { eventGalleryRouter } from "./event-gallery-router";
import { createRouter, publicQuery } from "./middleware";

// Agrupa e define a árvore principal de rotas (sub-routers) do tRPC para o backend
export const appRouter = createRouter({
  // Endpoint de teste rápido para conferir o status online do servidor
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,                  // Rotas de login, cadastro, logout e Google OAuth
  category: categoryRouter,          // Rotas para listagem e cadastro de causas marinhas
  ong: ongRouter,                    // Rotas para gerenciamento de perfis de ONGs
  event: eventRouter,                // Rotas de criação, edição e recomendação de eventos
  eventGallery: eventGalleryRouter,  // Rotas de fotos secundárias do evento
  enrollment: enrollmentRouter,      // Rotas de inscrições, confirmações de presença e fila de espera
  volunteer: volunteerRouter,        // Rotas para perfil do voluntário
  notification: notificationRouter,  // Rotas de avisos internos
  message: messageRouter,            // Rotas do sistema de mensagens direta (chat)
  upload: uploadRouter,              // Rotas para obter caminhos e salvar imagens
  admin: adminRouter,                // Rotas com privilégios de administração (estatísticas e moderadores)
  donation: donationRouter,          // Rotas para envio e visualização de doações financeiras
  certificate: certificateRouter,    // Rotas de emissão e verificação de certificados
});

export type AppRouter = typeof appRouter;
