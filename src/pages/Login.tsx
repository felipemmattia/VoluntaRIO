// Página de Login: gerencia a autenticação convencional (e-mail/senha) e autenticação externa via Google OAuth no Plataforma VoluntaRIO.
import { useState } from "react";
import { Link } from "react-router";
import { GoogleLogin } from "@react-oauth/google";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { fadeInUp, fadeInDown, staggerContainer, buttonHover } from "@/lib/motion-variants";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const utils = trpc.useUtils();

  // Mutação tRPC para autenticação convencional por e-mail e senha
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      toast.success("Bem-vindo de volta! O oceano sentiu sua falta.");
      const redirect = data.user.role === "admin" ? "/admin" : data.user.role === "ong_manager" ? "/ong" : "/dashboard";
      window.location.href = redirect;
    },
    onError: (error) => { toast.error(error.message || "Email ou senha incorretos"); },
  });

  // Mutação tRPC para autenticação via provedor Google OAuth
  const googleMutation = trpc.auth.google.useMutation({
    onSuccess: (data) => {
      console.log("Google login success:", data);
      toast.success("Login com Google realizado!");
      const redirect = data.user.role === "admin" ? "/admin" : data.user.role === "ong_manager" ? "/ong" : "/dashboard";
      window.location.href = redirect;
    },
    onError: (error) => {
      console.error("Google login error:", error);
      toast.error(error.message || "Erro ao fazer login com Google");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Preencha todos os campos"); return; }
    loginMutation.mutate({ email, password });
  };

  return (
    <motion.div
      className="flex min-h-[100dvh] items-center justify-center bg-[hsl(var(--warm-cream))] p-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-sm space-y-[52px]">
        <motion.div
          className="space-y-4 text-center"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.img
            src="/VoluntaRIO_Logo.png"
            alt="VoluntaRIO"
            width="120"
            height="40"
            decoding="async"
            className="mx-auto h-10 w-auto"
            variants={fadeInDown}
            transition={{ duration: 0.5, delay: 0.1 }}
          />
          <motion.h1 className="text-headline" variants={fadeInUp} transition={{ delay: 0.2 }}>
            Entrar na plataforma
          </motion.h1>
          <motion.p className="text-body text-pretty" variants={fadeInUp} transition={{ delay: 0.3 }}>
            Acesse sua conta para continuar contribuindo com causas marinhas
          </motion.p>
        </motion.div>

        <motion.div
          className="card-warm"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="space-y-5">
            <div className="relative w-full">
              {googleMutation.isPending && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-[hsl(var(--warm-cream))] bg-opacity-80 rounded-xl z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="h-5 w-5 rounded-full border-2 border-warm-ocean border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
              )}
              <GoogleLogin
                onSuccess={async (response) => {
                  if (response.credential) {
                    googleMutation.mutate({ credential: response.credential });
                  } else {
                    toast.error("Token do Google não recebido");
                  }
                }}
                onError={() => { toast.error("Erro no login com Google"); }}
                text="signin_with"
                shape="pill"
                size="large"
                width={320}
                locale="pt_BR"
              />
            </div>

            <motion.div
              className="flex items-center gap-4"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              style={{ transformOrigin: "center" }}
            >
              <div className="flex-1" style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }} />
              <span className="text-caption text-muted-foreground">ou</span>
              <div className="flex-1" style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }} />
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label htmlFor="email" className="text-label">Email</label>
                <motion.input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="input-warm"
                  whileFocus={{ scale: 1.01, borderColor: "hsl(var(--warm-ocean))" }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <label htmlFor="password" className="text-label">Senha</label>
                <motion.input
                  id="password"
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="input-warm"
                  whileFocus={{ scale: 1.01, borderColor: "hsl(var(--warm-ocean))" }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>
              <motion.button
                type="submit"
                className="btn-warm-primary w-full"
                disabled={loginMutation.isPending}
                variants={buttonHover}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                transition={{ delay: 0.7 }}
              >
                {loginMutation.isPending ? "Entrando..." : "Entrar"}
              </motion.button>
            </form>
          </div>
        </motion.div>

        <motion.p
          className="text-center text-body-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Nao tem uma conta?{" "}
          <Link to="/register" className="font-semibold text-[hsl(var(--warm-ocean))] transition-colors hover:text-[hsl(var(--warm-ocean-hover))]">Cadastre-se</Link>
        </motion.p>
      </div>
    </motion.div>
  );
}
