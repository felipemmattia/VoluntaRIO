// Página de Cadastro: gerencia a criação de novas contas de voluntários ou gestores de ONGs na Plataforma VoluntaRIO.
import { useState } from "react";
import { Link } from "react-router";
import { GoogleLogin } from "@react-oauth/google";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { fadeInUp, fadeInDown, staggerContainer, buttonHover } from "@/lib/motion-variants";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"user" | "ong_manager">("user");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  // Mutação tRPC para efetuar o cadastro convencional
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => { toast.success("Conta criada! Bem-vindo a comunidade VoluntaRIO."); window.location.href = data.role === "admin" ? "/admin" : data.role === "ong_manager" ? "/ong" : "/dashboard"; },
    onError: (error) => { toast.error(error.message || "Erro ao criar conta"); },
  });

  // Mutação tRPC para efetuar o cadastro usando o provedor Google OAuth
  const googleMutation = trpc.auth.google.useMutation({
    onSuccess: (data) => { toast.success("Conta criada com Google!"); const r = data.user.role === "admin" ? "/admin" : data.user.role === "ong_manager" ? "/ong" : "/dashboard"; window.location.href = r; },
    onError: (error) => { toast.error(error.message || "Erro ao criar conta com Google"); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) { toast.error("Preencha todos os campos"); return; }
    if (password !== confirmPassword) { toast.error("As senhas não coincidem"); return; }
    if (password.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres"); return; }
    if (!acceptTerms) { toast.error("Você deve aceitar os Termos de Uso para continuar"); return; }
    if (!acceptPrivacy) { toast.error("Você deve aceitar a Política de Privacidade para continuar"); return; }
    registerMutation.mutate({ name, email, password, role });
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
            Criar conta
          </motion.h1>
          <motion.p className="text-body text-pretty" variants={fadeInUp} transition={{ delay: 0.3 }}>
            Junte-se a nós e faça a diferença pelas causas marinhas
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
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <GoogleLogin
                onSuccess={async (response) => {
                  if (response.credential) {
                    googleMutation.mutate({ credential: response.credential });
                  }
                }}
                onError={() => { toast.error("Erro no login com Google"); }}
                text="signup_with"
                shape="pill"
                size="large"
                width={320}
                locale="pt_BR"
              />
            </motion.div>

            <motion.div
              className="flex items-center gap-4"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              style={{ transformOrigin: "center" }}
            >
              <div className="flex-1" style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }} />
              <span className="text-caption text-muted-foreground">ou cadastre-se com email</span>
              <div className="flex-1" style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }} />
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {[
                { id: "name", label: "Nome completo", placeholder: "Seu nome completo", value: name, onChange: setName, type: "text", autoComplete: "name", delay: 0.6 },
                { id: "email", label: "Email", placeholder: "seu@email.com", value: email, onChange: setEmail, type: "email", autoComplete: "email", delay: 0.7 },
                { id: "password", label: "Senha", placeholder: "Minimo 6 caracteres", value: password, onChange: setPassword, type: "password", autoComplete: "new-password", delay: 0.8 },
                { id: "confirmPassword", label: "Confirmar senha", placeholder: "Repita a senha", value: confirmPassword, onChange: setConfirmPassword, type: "password", autoComplete: "new-password", delay: 0.9 },
              ].map((field) => (
                <motion.div
                  key={field.id}
                  className="space-y-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: field.delay }}
                >
                  <label htmlFor={field.id} className="text-label">{field.label}</label>
                  <motion.input
                    id={field.id}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    autoComplete={field.autoComplete}
                    required
                    className="input-warm"
                    whileFocus={{ scale: 1.01, borderColor: "hsl(var(--warm-ocean))" }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.div>
              ))}

              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <span className="text-label">Tipo de conta</span>
                <div className="flex flex-col gap-2">
                  {["user", "ong_manager"].map((r, i) => (
                    <motion.label
                      key={r}
                      className="flex items-center gap-2 cursor-pointer"
                      whileHover={{ x: 4 }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: 1 + i * 0.1 }}
                    >
                      <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r as any)} className="accent-[hsl(var(--warm-ocean))]" />
                      <span className="text-body-sm">{r === "user" ? "Voluntário - Quero ajudar em eventos" : "ONG - Quero criar e gerenciar eventos"}</span>
                    </motion.label>
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="space-y-3 pt-2"
                style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                {[
                  { checked: acceptTerms, setChecked: setAcceptTerms, link: "/termos", label: "Termos de Uso" },
                  { checked: acceptPrivacy, setChecked: setAcceptPrivacy, link: "/privacidade", label: "Política de Privacidade" },
                ].map((item, i) => (
                  <motion.label
                    key={item.label}
                    className="flex items-start gap-2.5 cursor-pointer"
                    whileHover={{ x: 4 }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 1.2 + i * 0.1 }}
                  >
                    <input type="checkbox" checked={item.checked} onChange={(e) => item.setChecked(e.target.checked)} className="mt-0.5 h-4 w-4 rounded accent-[hsl(var(--warm-ocean))]" />
                    <span className="text-body-sm text-muted-foreground">
                      Li e aceito os{" "}
                      <Link to={item.link} target="_blank" className="font-medium text-warm-ocean underline underline-offset-2 hover:text-warm-ocean-hover">{item.label}</Link>
                      {" "}do VoluntaRIO
                    </span>
                  </motion.label>
                ))}
              </motion.div>

              <motion.button
                type="submit"
                className="btn-warm-primary w-full"
                disabled={registerMutation.isPending}
                variants={buttonHover}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                transition={{ delay: 1.4 }}
              >
                {registerMutation.isPending ? "Criando conta..." : "Criar conta"}
              </motion.button>
            </form>
          </div>
        </motion.div>

        <motion.p
          className="text-center text-body-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          Ja tem uma conta?{" "}
          <Link to="/login" className="font-semibold text-[hsl(var(--warm-ocean))] transition-colors hover:text-[hsl(var(--warm-ocean-hover))]">Fazer login</Link>
        </motion.p>
      </div>
    </motion.div>
  );
}
