export const Session = {
  cookieName: "voluntario_sid",
  maxAgeMs: 365 * 24 * 60 * 60 * 1000,
} as const;

export const ErrorMessages = {
  unauthenticated: "Autenticacao requerida",
  insufficientRole: "Permissoes insuficientes",
} as const;

export const Paths = {
  login: "/login",
  register: "/register",
} as const;
