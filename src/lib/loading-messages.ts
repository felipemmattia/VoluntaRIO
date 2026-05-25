// Lista de mensagens exibidas para o usuário durante carregamento de dados e páginas
const LOADING_MESSAGES = [
  "Navegando pelas correntes marinhas...",
  "Buscando eventos proximos a voce...",
  "Conectando com ONGs locais...",
  "Mapeando causas oceanicas...",
  "Preparando sua experiencia...",
  "Sincronizando com a mare...",
  "Organizando oportunidades de voluntariado...",
  "Verificando disponibilidade de vagas...",
];

// Índice da mensagem de carregamento atual
let messageIndex = 0;

// Obtém a próxima mensagem de carregamento em ordem circular rotativa
export function getNextLoadingMessage(): string {
  const message = LOADING_MESSAGES[messageIndex % LOADING_MESSAGES.length];
  messageIndex++;
  return message;
}

