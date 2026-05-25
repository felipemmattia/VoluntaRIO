// Página de Política de Privacidade: exibe os termos de privacidade, tratamento e segurança dos dados dos usuários em conformidade com a LGPD.
import { motion } from "framer-motion";
import { fadeInUp, fadeInDown, staggerContainer } from "@/lib/motion-variants";


export default function Privacy() {
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
            <motion.h1 className="text-display text-balance" variants={fadeInUp}>Política de Privacidade</motion.h1>
            <motion.p className="text-body-sm text-muted-foreground" variants={fadeInUp}>Última atualização: Maio de 2026</motion.p>
          </motion.div>

          <div className="space-y-10 text-body text-pretty">
            {[
               { title: "1. Introdução", content: "O VoluntaRIO valoriza sua privacidade e se compromete a proteger seus dados pessoais. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e compartilhamos suas informações quando você utiliza nossa plataforma. Ao utilizar o VoluntaRIO, você concorda com as práticas descritas nesta política." },
              { title: "2. Dados Coletados", content: "Coletamos os seguintes tipos de informações:", subsections: [{ title: "Dados fornecidos por você:", items: ["Nome completo", "Endereço de email", "Senha (armazenada de forma criptografada)", "Tipo de conta (voluntário ou ONG)", "Informações adicionais fornecidas no perfil"] }, { title: "Dados coletados automaticamente:", items: ["Endereço IP", "Tipo de navegador e dispositivo", "Páginas acessadas e tempo de permanência", "Localização aproximada (para recomendação de eventos)"] }] },
              { title: "3. Finalidade do Uso", content: "Utilizamos seus dados para:", list: ["Criar e gerenciar sua conta na plataforma", "Conectar voluntários a eventos e ONGs relevantes", "Processar inscrições em eventos de voluntariado", "Emitir certificados digitais de participação", "Enviar notificações importantes sobre eventos e conta", "Melhorar a experiência e funcionalidade da plataforma", "Garantir a segurança e integridade do serviço"] },
               { title: "4. Compartilhamento de Dados", content: "Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins comerciais. Seus dados podem ser compartilhados apenas nas seguintes situações:", list: ["Com ONGs: Seu nome e email são compartilhados com a ONG responsável pelo evento quando você se inscreve", "Por exigência legal: Quando necessário para cumprir obrigações legais ou ordens judiciais", "Proteção de direitos: Para proteger os direitos, propriedade ou segurança do VoluntaRIO e de seus usuários"] },
               { title: "5. Armazenamento e Segurança", content: "Seus dados são armazenados em servidores seguros com as seguintes medidas de proteção:", list: ["Senhas criptografadas com algoritmo bcrypt", "Conexões seguras via HTTPS", "Tokens de autenticação com validade limitada", "Acesso restrito aos dados por equipe autorizada", "Backups regulares com proteção adequada"], extra: "Apesar dos esforços de segurança, nenhum sistema é completamente seguro. Recomendamos que você também proteja sua conta utilizando senhas fortes e não compartilhando suas credenciais." },
               { title: "6. Cookies e Tecnologias Similares", content: "O VoluntaRIO utiliza cookies e tecnologias similares para:", list: ["Manter sua sessão ativa durante o uso da plataforma", "Lembrar suas preferências (como modo claro/escuro)", "Analisar o uso da plataforma para melhorias"], extra: "Você pode configurar seu navegador para recusar cookies, mas isso pode afetar algumas funcionalidades da plataforma." },
              { title: "7. Seus Direitos", content: "De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:", list: ["Acessar seus dados pessoais armazenados", "Corrigir dados incompletos, inexatos ou desatualizados", "Solicitar a exclusão de seus dados pessoais", "Solicitar a portabilidade de seus dados", "Revogar o consentimento a qualquer momento", "Saber com quais entidades seus dados foram compartilhados"], extra: "Para exercer qualquer um desses direitos, entre em contato conosco pelo email contato@voluntario.org." },
               { title: "8. Retenção de Dados", content: "Seus dados serão mantidos enquanto sua conta estiver ativa ou conforme necessário para fornecer os serviços. Após a exclusão da conta, seus dados serão removidos em até 30 dias, exceto quando a retenção for necessária para cumprir obrigações legais." },
               { title: "9. Menores de Idade", content: "O VoluntaRIO não é direcionado a menores de 18 anos. Caso tenhamos conhecimento de que coletamos dados pessoais de um menor sem consentimento dos responsáveis, tomaremos medidas para excluir essas informações." },
               { title: "10. Alterações nesta Política", content: "Podemos atualizar esta Política de Privacidade periodicamente. Alterações significativas serão comunicadas por meio da plataforma ou por email. Recomendamos que você revise esta política regularmente." },
              { title: "11. Contato", content: "Para dúvidas, solicitações ou preocupações sobre esta Política de Privacidade:", contact: { email: "contato@voluntario.org", project: "TCC - ETEC Desenvolvimento de Sistemas, 2026" } },
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
                {section.subsections && section.subsections.map((sub, j) => (
                  <motion.div key={j} variants={staggerContainer}>
                    <motion.h3 className="text-body font-semibold text-foreground" variants={fadeInUp}>{sub.title}</motion.h3>
                    <motion.ul className="list-disc space-y-2 pl-6" variants={staggerContainer}>
                      {sub.items.map((item, k) => (
                        <motion.li key={k} variants={fadeInUp}>{item}</motion.li>
                      ))}
                    </motion.ul>
                  </motion.div>
                ))}
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
