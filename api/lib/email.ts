import { Resend } from "resend";
import { env } from "./env";

// Inicializa o cliente Resend para envio real se a chave de API estiver definida
const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

const FROM_EMAIL = env.resendFromEmail || "VoluntaRIO <onboarding@resend.dev>";
const FRONTEND_URL = env.frontendUrl || "http://localhost:3000";

// Estrutura de layout HTML padrão usada para todos os e-mails enviados pela plataforma
function emailLayout(title: string, body: string, accentColor = "#0EA5E9") {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; background: #f0f9ff; color: #1e293b; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0EA5E9, #06B6D4); padding: 32px 24px; text-align: center; border-radius: 16px 16px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px; }
    .body { background: white; padding: 32px 24px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .body h2 { color: #0f172a; margin: 0 0 16px; font-size: 20px; }
    .body p { color: #475569; line-height: 1.6; margin: 0 0 12px; font-size: 15px; }
    .body ul { padding-left: 20px; }
    .body li { color: #475569; line-height: 1.8; font-size: 15px; }
    .btn { display: inline-block; padding: 12px 24px; background: ${accentColor}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 8px 8px 8px 0; }
    .btn-secondary { background: #64748b; }
    .divider { height: 1px; background: #e2e8f0; margin: 24px 0; }
    .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 13px; }
    .footer a { color: #0EA5E9; text-decoration: none; }
    .badge { display: inline-block; padding: 4px 12px; background: #f0f9ff; color: #0EA5E9; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .info-box { background: #f8fafc; border-left: 4px solid ${accentColor}; padding: 16px; border-radius: 0 8px 8px 0; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🐙 VoluntaRIO</h1>
      <p>Conectando voluntarios a causas marinhas</p>
    </div>
    <div class="body">
      <span class="badge">${title}</span>
      ${body}
    </div>
    <div class="footer">
      <p>Este email foi enviado por VoluntaRIO — Plataforma de Voluntariado Marinho</p>
      <p>Projeto TCC — ETEC Desenvolvimento de Sistemas, 2026</p>
      <p><a href="${FRONTEND_URL}">visite voluntario.org</a></p>
    </div>
  </div>
</body>
</html>`;
}

// Função genérica que dispara o e-mail utilizando a API do Resend ou simula no log se não configurado
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  try {
    if (!resend) {
      console.warn(`[email] Resend nao configurado. Email para ${to}: ${subject}`);
      console.warn(`[email] Defina RESEND_API_KEY no .env para envio real.`);
      return false;
    }
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
    });
    console.log(`[email] Enviado para ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error("[email] Falha ao enviar:", error);
    return false;
  }
}

// Dispara o e-mail de boas-vindas após o cadastro com as instruções iniciais para voluntários ou ONGs
export async function sendWelcomeEmail({
  email,
  name,
  role,
}: {
  email: string;
  name: string;
  role: string;
}) {
  const roleLabel = role === "ong_manager" ? "ONG" : "Voluntario";
  const body = `
    <h2>Bem-vindo(a) ao VoluntaRIO, ${name}!</h2>
    <p>Sua conta como <strong>${roleLabel}</strong> foi criada com sucesso. Estamos felizes em ter voce na nossa missao de proteger os oceanos.</p>
    <div class="info-box">
      <p><strong>Próximos passos:</strong></p>
      ${role === "ong_manager"
        ? `<ul><li>Complete o perfil da sua ONG</li><li>Crie seu primeiro evento de voluntariado</li><li>Conecte-se com voluntarios da sua regiao</li></ul>`
        : `<ul><li>Complete seu perfil com suas habilidades e interesses</li><li>Explore eventos na sua regiao</li><li>Inscreva-se em causas que fazem sentido para voce</li></ul>`
      }
    </div>
    <p><a href="${FRONTEND_URL}/dashboard" class="btn">Acessar meu painel</a></p>
  `;
  return sendEmail({
    to: email,
    subject: "Bem-vindo(a) ao VoluntaRIO! 🐙",
    html: emailLayout("Boas-vindas", body),
  });
}

// Dispara notificação confirmando a inscrição do voluntário em um evento
export async function sendEnrollmentConfirmation({
  volunteerEmail,
  volunteerName,
  eventTitle,
  eventDate,
  accepted,
}: {
  volunteerEmail: string;
  volunteerName: string;
  eventTitle: string;
  eventDate: string;
  accepted: boolean;
}) {
  const body = `
    <h2>Inscricao Confirmada!</h2>
    <p>Olá, <strong>${volunteerName}</strong>!</p>
    <p>${accepted
      ? `Sua inscrição para o evento <strong>${eventTitle}</strong> foi confirmada com sucesso.`
      : `Sua inscrição para o evento <strong>${eventTitle}</strong> em <strong>${eventDate}</strong> foi aceita pela ONG organizadora.`
    }</p>
    <div class="info-box">
      <p><strong>Detalhes do evento:</strong></p>
      <ul>
        <li><strong>Evento:</strong> ${eventTitle}</li>
        <li><strong>Data:</strong> ${eventDate}</li>
      </ul>
    </div>
    <p><a href="${FRONTEND_URL}/eventos" class="btn">Ver meus eventos</a></p>
    <p>Obrigado por contribuir com causas marinhas!</p>
  `;
  return sendEmail({
    to: volunteerEmail,
    subject: accepted ? "Inscricao Confirmada - VoluntaRIO" : "Inscricao Aceita - VoluntaRIO",
    html: emailLayout("Confirmacao", body),
  });
}

// Dispara notificação de inscrição pendente aguardando a aprovação da ONG organizadora
export async function sendEnrollmentPendingEmail({
  volunteerEmail,
  volunteerName,
  eventTitle,
  eventDate,
}: {
  volunteerEmail: string;
  volunteerName: string;
  eventTitle: string;
  eventDate: string;
}) {
  const body = `
    <h2>Inscricao Recebida!</h2>
    <p>Olá, <strong>${volunteerName}</strong>!</p>
    <p>Sua inscrição para o evento <strong>${eventTitle}</strong> em <strong>${eventDate}</strong> foi recebida.</p>
    <div class="info-box">
      <p><strong>Aguardando confirmacao:</strong> A ONG organizadora precisa aprovar sua inscricao. Voce sera notificado assim que houver uma resposta.</p>
    </div>
    <p><a href="${FRONTEND_URL}/dashboard" class="btn">Ver minhas inscricoes</a></p>
  `;
  return sendEmail({
    to: volunteerEmail,
    subject: "Inscricao Recebida - Aguardando Confirmacao - VoluntaRIO",
    html: emailLayout("Aguardando", body),
  });
}

// Dispara notificação caso a inscrição do voluntário no evento seja recusada pela ONG
export async function sendEnrollmentRejectionEmail({
  volunteerEmail,
  volunteerName,
  eventTitle,
}: {
  volunteerEmail: string;
  volunteerName: string;
  eventTitle: string;
}) {
  const body = `
    <h2>Inscricao Nao Aceita</h2>
    <p>Olá, <strong>${volunteerName}</strong>.</p>
    <p>Informamos que sua inscricao para o evento <strong>${eventTitle}</strong> nao foi aceita pela ONG organizadora.</p>
    <div class="info-box">
      <p>Nao desanime! Explore outros eventos disponiveis na plataforma e encontre uma causa que combine com voce.</p>
    </div>
    <p><a href="${FRONTEND_URL}/eventos" class="btn">Explorar eventos</a></p>
  `;
  return sendEmail({
    to: volunteerEmail,
    subject: "Inscricao Nao Aceita - VoluntaRIO",
    html: emailLayout("Atualizacao", body),
  });
}

// Dispara notificação quando o voluntário entra na fila de espera por falta de vagas livres
export async function sendWaitlistNotification({
  volunteerEmail,
  volunteerName,
  eventTitle,
}: {
  volunteerEmail: string;
  volunteerName: string;
  eventTitle: string;
}) {
  const body = `
    <h2>Fila de Espera</h2>
    <p>Olá, <strong>${volunteerName}</strong>!</p>
    <p>O evento <strong>${eventTitle}</strong> atingiu sua capacidade máxima.</p>
    <div class="info-box">
      <p>Você foi adicionado à <strong>fila de espera</strong> e será notificado caso uma vaga seja liberada. Fique atento ao seu email!</p>
    </div>
    <p><a href="${FRONTEND_URL}/eventos" class="btn">Ver outros eventos</a></p>
  `;
  return sendEmail({
    to: volunteerEmail,
    subject: "Voce entrou na fila de espera - VoluntaRIO",
    html: emailLayout("Fila de Espera", body),
  });
}

// Dispara notificação de vaga liberada com links para aceitar ou recusar a vaga dentro de 24 horas
export async function sendWaitlistPromotion({
  volunteerEmail,
  volunteerName,
  eventTitle,
  eventDate,
  acceptUrl,
  declineUrl,
}: {
  volunteerEmail: string;
  volunteerName: string;
  eventTitle: string;
  eventDate: string;
  acceptUrl: string;
  declineUrl: string;
}) {
  const body = `
    <h2>Vaga Disponivel!</h2>
    <p>Olá, <strong>${volunteerName}</strong>!</p>
    <p>Uma vaga foi liberada no evento <strong>${eventTitle}</strong> em <strong>${eventDate}</strong>.</p>
    <div class="info-box">
      <p>Você tem <strong>24 horas</strong> para confirmar sua participação. Se não houver resposta, a vaga será oferecida ao próximo da fila.</p>
    </div>
    <p>
      <a href="${acceptUrl}" class="btn">Aceitar Vaga</a>
      <a href="${declineUrl}" class="btn btn-secondary">Recusar</a>
    </p>
  `;
  return sendEmail({
    to: volunteerEmail,
    subject: "Vaga disponivel no evento - VoluntaRIO",
    html: emailLayout("Oportunidade", body),
  });
}

// Dispara notificação informando o cancelamento do evento aos voluntários inscritos
export async function sendEventCancellation({
  volunteerEmail,
  volunteerName,
  eventTitle,
}: {
  volunteerEmail: string;
  volunteerName: string;
  eventTitle: string;
}) {
  const body = `
    <h2>Evento Cancelado</h2>
    <p>Olá, <strong>${volunteerName}</strong>.</p>
    <p>Informamos que o evento <strong>${eventTitle}</strong> foi cancelado pela ONG organizadora.</p>
    <div class="info-box">
      <p>Sua inscricao foi automaticamente cancelada. Explore outros eventos disponiveis na plataforma.</p>
    </div>
    <p><a href="${FRONTEND_URL}/eventos" class="btn">Explorar eventos</a></p>
  `;
  return sendEmail({
    to: volunteerEmail,
    subject: "Evento cancelado - VoluntaRIO",
    html: emailLayout("Cancelamento", body),
  });
}

// Dispara notificação aos voluntários detalhando as modificações realizadas no evento (data, hora, local)
export async function sendEventUpdateNotification({
  volunteerEmail,
  volunteerName,
  eventTitle,
  changes,
}: {
  volunteerEmail: string;
  volunteerName: string;
  eventTitle: string;
  changes: string[];
}) {
  const body = `
    <h2>Atualizacao no Evento</h2>
    <p>Olá, <strong>${volunteerName}</strong>!</p>
    <p>O evento <strong>${eventTitle}</strong> foi atualizado:</p>
    <div class="info-box">
      <ul>
        ${changes.map((c) => `<li>${c}</li>`).join("")}
      </ul>
    </div>
    <p>Verifique os novos detalhes na plataforma.</p>
    <p><a href="${FRONTEND_URL}/eventos" class="btn">Ver evento</a></p>
  `;
  return sendEmail({
    to: volunteerEmail,
    subject: "Atualizacao no evento - VoluntaRIO",
    html: emailLayout("Atualizacao", body),
  });
}

// Dispara e-mail parabenizando o gestor pela aprovação e ativação da ONG na plataforma
export async function sendOngApprovalEmail({
  email,
  name,
  ongName,
}: {
  email: string;
  name: string;
  ongName: string;
}) {
  const body = `
    <h2>ONG Aprovada!</h2>
    <p>Olá, <strong>${name}</strong>!</p>
    <p>A ONG <strong>${ongName}</strong> foi aprovada e agora está ativa na plataforma VoluntaRIO.</p>
    <div class="info-box">
      <p><strong>Próximos passos:</strong></p>
      <ul>
        <li>Crie eventos de voluntariado para sua causa</li>
        <li>Gerencie inscricoes de voluntarios</li>
        <li>Comunique-se com seus voluntarios pelo sistema de mensagens</li>
      </ul>
    </div>
    <p><a href="${FRONTEND_URL}/ong" class="btn">Acessar painel da ONG</a></p>
  `;
  return sendEmail({
    to: email,
    subject: "Sua ONG foi aprovada - VoluntaRIO",
    html: emailLayout("Aprovacao", body),
  });
}

// Dispara e-mail notificando a suspensão da ONG na plataforma
export async function sendOngRejectionEmail({
  email,
  name,
  ongName,
}: {
  email: string;
  name: string;
  ongName: string;
}) {
  const body = `
    <h2>ONG Suspensa</h2>
    <p>Olá, <strong>${name}</strong>.</p>
    <p>Informamos que a ONG <strong>${ongName}</strong> foi suspensa na plataforma VoluntaRIO.</p>
    <div class="info-box">
      <p>Entre em contato com a administracao da plataforma para mais informacoes.</p>
    </div>
    <p><a href="${FRONTEND_URL}/sobre" class="btn">Contato</a></p>
  `;
  return sendEmail({
    to: email,
    subject: "Sua ONG foi suspensa - VoluntaRIO",
    html: emailLayout("Suspensao", body),
  });
}

// Dispara notificação e agradecimento ao voluntário confirmando a doação financeira realizada
export async function sendDonationConfirmation({
  donorEmail,
  donorName,
  ongName,
  amount,
  eventTitle,
}: {
  donorEmail: string;
  donorName: string;
  ongName: string;
  amount: number;
  eventTitle?: string;
}) {
  const body = `
    <h2>Doacao Confirmada!</h2>
    <p>Olá, <strong>${donorName}</strong>!</p>
    <p>Sua doacao de <strong>R$ ${amount.toFixed(2)}</strong> para a ONG <strong>${ongName}</strong> foi registrada com sucesso.</p>
    ${eventTitle ? `<p>Evento associado: <strong>${eventTitle}</strong></p>` : ""}
    <div class="info-box">
      <p>Obrigado por contribuir com causas marinhas! Sua generosidade faz a diferenca.</p>
    </div>
    <p><a href="${FRONTEND_URL}/doacoes" class="btn">Ver minhas doacoes</a></p>
  `;
  return sendEmail({
    to: donorEmail,
    subject: "Doacao Confirmada - VoluntaRIO",
    html: emailLayout("Doacao", body),
  });
}

// Dispara e-mail informando que o certificado de participação em um evento foi emitido e está disponível
export async function sendCertificateIssued({
  volunteerEmail,
  volunteerName,
  eventTitle,
  hours,
  certificateUrl,
}: {
  volunteerEmail: string;
  volunteerName: string;
  eventTitle: string;
  hours: number;
  certificateUrl: string;
}) {
  const body = `
    <h2>Certificado Emitido!</h2>
    <p>Olá, <strong>${volunteerName}</strong>!</p>
    <p>Seu certificado de participacao no evento <strong>${eventTitle}</strong> foi emitido.</p>
    <div class="info-box">
      <p><strong>Horas contribuidas:</strong> ${hours}h</p>
      <p><strong>Codigo de verificacao:</strong> O certificado contem um codigo unico de autenticidade.</p>
    </div>
    <p><a href="${certificateUrl}" class="btn">Baixar certificado</a></p>
    <p>Parabens pelo seu impacto nas causas marinhas!</p>
  `;
  return sendEmail({
    to: volunteerEmail,
    subject: "Seu certificado esta pronto - VoluntaRIO",
    html: emailLayout("Certificado", body),
  });
}

// Dispara e-mail notificando o recebimento de uma nova mensagem direta pelo sistema de chat da plataforma
export async function sendNewMessageNotification({
  recipientEmail,
  recipientName,
  senderName,
  eventTitle,
  preview,
}: {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  eventTitle?: string;
  preview: string;
}) {
  const body = `
    <h2>Nova Mensagem</h2>
    <p>Olá, <strong>${recipientName}</strong>!</p>
    <p><strong>${senderName}</strong> enviou uma mensagem para voce${eventTitle ? ` sobre o evento <strong>${eventTitle}</strong>` : ""}.</p>
    <div class="info-box">
      <p><em>"${preview.length > 100 ? preview.substring(0, 100) + "..." : preview}"</em></p>
    </div>
    <p><a href="${FRONTEND_URL}/mensagens" class="btn">Ver mensagens</a></p>
  `;
  return sendEmail({
    to: recipientEmail,
    subject: `Nova mensagem de ${senderName} - VoluntaRIO`,
    html: emailLayout("Mensagem", body),
  });
}
