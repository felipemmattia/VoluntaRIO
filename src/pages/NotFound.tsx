// Página de Erro 404 (Não Encontrado): exibida quando a rota inserida pelo usuário não corresponde a nenhuma página válida do sistema.
import { motion } from "framer-motion";
import { Waves, ArrowLeft } from "@phosphor-icons/react";
import { Link } from "react-router";
import { fadeInUp, fadeInDown, scaleIn, iconFloat, staggerContainer, buttonHover } from "@/lib/motion-variants";

export default function NotFound() {
  return (
    <motion.div
      className="flex min-h-[100dvh] items-center justify-center bg-[hsl(var(--carex-surface-alt))]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container-warm max-w-lg text-center">
        <motion.div className="space-y-4" initial="hidden" animate="visible" variants={staggerContainer}>
          <motion.div variants={iconFloat} animate="animate">
            <Waves weight="duotone" className="mx-auto h-16 w-16 text-[hsl(var(--warm-ocean))] opacity-40" />
          </motion.div>
          <motion.p className="text-display text-7xl font-medium tracking-tighter" variants={scaleIn}>404</motion.p>
          <motion.h1 className="text-headline" variants={fadeInUp}>Perdido em alto mar</motion.h1>
          <motion.p className="text-body-lg mx-auto max-w-[45ch] text-pretty text-[hsl(var(--text-secondary))]" variants={fadeInUp}>
            Esta pagina foi levada pela correnteza. Navegue de volta ao inicio e recomece sua jornada.
          </motion.p>
        </motion.div>
        <motion.div className="mt-8 flex flex-col items-center gap-3" initial="hidden" animate="visible" variants={staggerContainer} custom={1}>
          <motion.div variants={buttonHover} whileHover="hover" whileTap="tap">
            <Link to="/">
              <button className="btn-warm-primary gap-2">
                <ArrowLeft weight="duotone" className="h-3.5 w-3.5" />
                Voltar ao inicio
              </button>
            </Link>
          </motion.div>
          <motion.div variants={fadeInUp} custom={2}>
            <Link to="/eventos" className="text-caption text-[hsl(var(--text-secondary))] transition-colors hover:text-[hsl(var(--warm-ocean))] hover:underline">
              Ou explore eventos disponiveis
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

