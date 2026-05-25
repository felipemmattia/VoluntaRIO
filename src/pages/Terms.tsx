// Página de Termos de Uso: exibe os termos de serviço, obrigações legais, responsabilidades de voluntários e ONGs na Plataforma VoluntaRIO.
import { motion } from "framer-motion";
import { fadeInUp, fadeInDown, staggerContainer } from "@/lib/motion-variants";


export default function Terms() {
  return (
    <motion.div
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <section className="section-warm" style={{ backgroundColor: "hsl(var(--warm-cream))" }}>
        <div className="container-warm max-w-3xl">
          <motion.div
            className="mb-12 space-y-4"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.p className="text-label" variants={fadeInDown}>Legal</motion.p>
            <motion.h1 className="text-display text-balance" variants={fadeInUp}>Termos de Uso</motion.h1>
            <motion.p className="text-body-sm text-muted-foreground" variants={fadeInUp}>Última atualização: Maio de 2026</motion.p>
          </motion.div>

          <div className="space-y-10 text-body text-pretty">
            {[
              { title: "1. Aceitação dos Termos", content: "Ao acessar e utilizar a plataforma VoluntaRIO, você concorda integralmente com estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não utilize a plataforma. O VoluntaRIO é uma plataforma gratuita que conecta voluntários a organizações não governamentais (ONGs) dedicadas à preservação da vida marinha no Brasil." },
              { title: "2. Descrição do Serviço", content: "O VoluntaRIO oferece os seguintes serviços:", list: ["Cadastro de voluntários e ONGs", "Criação e divulgação de eventos de voluntariado", "Inscrição e participação em eventos", "Emissão de certificados digitais de voluntariado", "Comunicação entre voluntários e ONGs", "Acompanhamento de impacto e histórico de participação"], extra: "O VoluntaRIO atua como intermediário entre voluntários e ONGs, não sendo responsável pela execução direta dos eventos ou pelas ações das organizações cadastradas." },
               { title: "3. Cadastro e Conta", content: "Para utilizar a plataforma, você deve criar uma conta fornecendo informações verdadeiras, completas e atualizadas. Você é responsável por:", list: ["Manter a confidencialidade de sua senha", "Todas as atividades realizadas em sua conta", "Notificar imediatamente qualquer uso não autorizado", "Garantir que as informações fornecidas sejam precisas"], extra: "O VoluntaRIO se reserva o direito de suspender ou encerrar contas que violem estes termos ou que contenham informações falsas." },
              { title: "4. Conduta do Usuário", content: "Ao utilizar a plataforma, você se compromete a:", list: ["Não utilizar a plataforma para fins ilegais ou não autorizados", "Não publicar conteúdo ofensivo, discriminatório ou enganoso", "Não interferir no funcionamento técnico da plataforma", "Respeitar outros usuários, ONGs e voluntários", "Não criar contas falsas ou se passar por outra pessoa ou entidade", "Cumprir todas as leis e regulamentos aplicáveis"] },
              { title: "5. Responsabilidades das ONGs", content: "As ONGs cadastradas se comprometem a:", list: ["Fornecer informações verdadeiras sobre a organização", "Descrever os eventos de forma clara e precisa", "Garantir condições seguras para os voluntários durante os eventos", "Respeitar os horários e condições informados no cadastro do evento", "Não solicitar pagamentos ou contribuições financeiras obrigatórias"] },
               { title: "6. Propriedade Intelectual", content: "Todo o conteúdo da plataforma VoluntaRIO, incluindo textos, imagens, logotipos, design e código-fonte, é protegido por direitos autorais e de propriedade intelectual. É proibida a reprodução, distribuição ou modificação sem autorização prévia." },
               { title: "7. Limitação de Responsabilidade", content: "O VoluntaRIO não se responsabiliza por:", list: ["Danos diretos ou indiretos resultantes do uso da plataforma", "Conteúdo publicado por usuários ou ONGs", "Incidentes ocorridos durante eventos de voluntariado", "Interrupções temporárias do serviço por manutenção ou falhas técnicas"] },
               { title: "8. Alterações nos Termos", content: "O VoluntaRIO pode modificar estes Termos de Uso a qualquer momento. Alterações significativas serão comunicadas aos usuários por meio da plataforma ou por email. O uso continuado da plataforma após as alterações constitui aceitação dos novos termos." },
               { title: "9. Encerramento", content: "O VoluntaRIO pode encerrar ou suspender sua conta a qualquer momento, sem prévio aviso, por violação destes termos. Você pode encerrar sua conta a qualquer momento pelas configurações do perfil ou entrando em contato conosco." },
              { title: "10. Contato", content: "Para dúvidas sobre estes Termos de Uso, entre em contato:", contact: { email: "contato@voluntario.org", project: "TCC - ETEC Desenvolvimento de Sistemas, 2026" } },
            ].map((section, i) => (
              <motion.section
                key={section.title}
                className="space-y-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={staggerContainer}
              >
                <motion.h2 className="text-title" variants={fadeInUp}>{section.title}</motion.h2>
                <motion.p variants={fadeInUp}>{section.content}</motion.p>
                {section.list && (
                  <motion.ul className="list-disc space-y-2 pl-6" variants={staggerContainer}>
                    {section.list.map((item, j) => (
                      <motion.li key={j} variants={fadeInUp}>{item}</motion.li>
                    ))}
                  </motion.ul>
                )}
                {section.extra && <motion.p variants={fadeInUp}>{section.extra}</motion.p>}
                {section.contact && (
                  <motion.div variants={fadeInUp}>
                    <p><strong>Email:</strong> {section.contact.email}</p>
                    <p><strong>Projeto:</strong> {section.contact.project}</p>
                  </motion.div>
                )}
              </motion.section>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  );
}
