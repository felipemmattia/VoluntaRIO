import { Link } from "react-router";
import { Waves, Users, Globe, Heart, Target, Shield, Leaf, Anchor, Fish, Drop, ArrowRight } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { fadeInUp, fadeInDown, fadeInRight, staggerContainer, cardHover, buttonHover, scaleIn, iconFloat } from "@/lib/motion-variants";

export default function About() {
  const values = [
    { icon: Heart, title: "Paixão pelo oceano", desc: "Nosso amor pelos mares e oceanos guia cada decisão que tomamos." },
    { icon: Users, title: "Comunidade", desc: "Acreditamos no poder da colaboração entre pessoas e organizações." },
    { icon: Shield, title: "Transparência", desc: "Todas as ações são conduzidas com clareza e responsabilidade." },
    { icon: Target, title: "Impacto real", desc: "Buscamos resultados mensuráveis na preservação da vida marinha." },
  ];

  const causes = [
    { icon: Waves, name: "Limpeza de oceanos", desc: "Remoção de lixo e poluentes" },
    { icon: Leaf, name: "Restauração de corais", desc: "Cultivo e transplantio de corais" },
    { icon: Fish, name: "Proteção da vida marinha", desc: "Conservação de espécies" },
    { icon: Anchor, name: "Conservação costeira", desc: "Preservação de manguezais e dunas" },
    { icon: Drop, name: "Monitoramento de poluição", desc: "Vigilância da qualidade da água" },
  ];

  const team = [
    { name: "Felipe Moreira de Mattia", role: "Desenvolvedor Back-End" },
    { name: "Israel Matheus da Silva", role: "Scrum Master" },
    { name: "Davi Mendes de Moura", role: "Desenvolvedor Front-End / UI-UX" },
    { name: "Maria Eduarda Rodrigues de Almeida", role: "Product Owner" },
  ];

  return (
    <motion.div
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero */}
      <section className="section-warm bg-[hsl(var(--warm-cream))]">
        <div className="container-warm text-center">
          <motion.div
            className="mx-auto mb-6 inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--warm-ocean-light))] px-3 py-1 text-xs font-semibold text-[hsl(var(--warm-ocean))]"
            initial="hidden"
            animate="visible"
            variants={fadeInDown}
          >
            <Globe className="h-3.5 w-3.5" />
            ODS 14 - Vida na Água
          </motion.div>
          <motion.h1
            className="text-display mx-auto max-w-3xl"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.1 }}
          >
            Sobre o VoluntaRIO
          </motion.h1>
          <motion.p
            className="text-body-lg mx-auto mt-4 max-w-[55ch] text-pretty"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.2 }}
          >
            Uma plataforma colaborativa dedicada a conectar voluntários e ONGs na missão de preservar e proteger a vida marinha do Brasil.
          </motion.p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-warm">
        <div className="container-warm">
          <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
            <div className="space-y-12">
              <motion.div
                className="space-y-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={staggerContainer}
              >
                <motion.div className="h-px w-12 bg-[hsl(var(--warm-ocean))]" variants={fadeInUp} />
                <motion.h2 className="text-headline" variants={fadeInUp}>Nossa missão</motion.h2>
                <motion.p className="text-body text-pretty" variants={fadeInUp}>
                  Desenvolver um ecossistema digital que conecte ONGs de preservação marinha a indivíduos interessados em voluntariado, promovendo o engajamento social por meio de ferramentas digitais modernas e acessíveis.
                </motion.p>
              </motion.div>
              <motion.div
                className="space-y-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={staggerContainer}
              >
                <motion.div className="h-px w-12 bg-[hsl(var(--warm-ocean))]" variants={fadeInUp} />
                <motion.h2 className="text-headline" variants={fadeInUp}>Nossa visao</motion.h2>
                <motion.p className="text-body text-pretty" variants={fadeInUp}>
                  Ser a principal plataforma de conexão entre voluntários e organizações ambientais no Brasil, catalisando ações concretas para a preservação dos ecossistemas marinhos e o cumprimento do ODS 14.
                </motion.p>
              </motion.div>
            </div>
            <motion.div
              className="flex justify-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={fadeInRight}
            >
              <div className="image-plate w-full max-w-sm">
                <motion.img
                  src="/VoluntaRIO_Polvo.png"
                  alt="Mascote VoluntaRIO"
                  width="320"
                  height="320"
                  loading="lazy"
                  decoding="async"
                  className="w-full"
                  variants={iconFloat}
                  animate="animate"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="container-warm"><div className="divider-warm" /></div>

      {/* Values */}
      <section className="section-warm bg-[hsl(var(--warm-sand))]">
        <div className="container-warm">
          <motion.div
            className="mx-auto mb-12 max-w-[50ch] space-y-3 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
          >
            <motion.span className="badge-warm" variants={fadeInUp}>Nossos valores</motion.span>
            <motion.h2 className="text-headline" variants={fadeInUp}>Princípios que nos guiam</motion.h2>
            <motion.p className="text-body text-pretty" variants={fadeInUp}>Princípios que guiam nossa atuação e relacionamento com a comunidade.</motion.p>
          </motion.div>
          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
          >
            {values.map((val) => (
              <motion.div
                key={val.title}
                className="card-warm group text-center"
                variants={cardHover}
                initial="rest"
                whileHover="hover"
              >
                <motion.div
                  className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--warm-ocean-light))] text-[hsl(var(--warm-ocean))]"
                  whileHover={{ scale: 1.1, rotate: 3 }}
                  transition={{ duration: 0.3 }}
                >
                  <val.icon weight="duotone" className="h-6 w-6" />
                </motion.div>
                <motion.h3
                  className="text-title mb-2"
                  whileHover={{ color: "hsl(var(--warm-ocean))" }}
                  transition={{ duration: 0.2 }}
                >
                  {val.title}
                </motion.h3>
                <p className="text-body-sm text-[hsl(var(--text-muted))] text-pretty">{val.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Causes */}
      <section className="section-warm-tight">
        <div className="container-warm">
          <motion.div
            className="mx-auto mb-10 max-w-[50ch] space-y-3 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
          >
            <motion.span className="badge-warm-coral" variants={fadeInUp}>Causas</motion.span>
            <motion.h2 className="text-headline" variants={fadeInUp}>Causas que apoiamos</motion.h2>
            <motion.p className="text-body text-pretty" variants={fadeInUp}>Cinco pilares de atuação alinhados ao ODS 14 - Vida na Água.</motion.p>
          </motion.div>
          <motion.div
            className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
          >
            {causes.map((cause) => (
              <motion.div
                key={cause.name}
                className="card-warm-subtle group min-w-[200px] snap-start shrink-0 text-center"
                variants={cardHover}
                initial="rest"
                whileHover="hover"
              >
                <motion.div
                  className="mx-auto mb-3"
                  whileHover={{ scale: 1.1, rotate: 6 }}
                  transition={{ duration: 0.3 }}
                >
                  <cause.icon className="h-9 w-9 text-[hsl(var(--warm-ocean))]" />
                </motion.div>
                <motion.h3
                  className="text-body-sm mb-1 font-semibold tracking-tight text-[hsl(var(--text-display))]"
                  whileHover={{ color: "hsl(var(--warm-ocean))" }}
                  transition={{ duration: 0.2 }}
                >
                  {cause.name}
                </motion.h3>
                <p className="text-caption">{cause.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team */}
      <section className="section-warm bg-[hsl(var(--warm-sand))]">
        <div className="container-warm">
          <motion.div
            className="mx-auto mb-12 max-w-[55ch] space-y-3 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
          >
            <motion.span className="badge-warm-sand" variants={fadeInUp}>Equipe</motion.span>
            <motion.h2 className="text-headline" variants={fadeInUp}>Equipe de desenvolvimento</motion.h2>
            <motion.p className="text-body text-pretty" variants={fadeInUp}>Quatro estudantes do Curso Tecnico em Desenvolvimento de Sistemas da ETEC, unidos pela paixao pela tecnologia e pelo meio ambiente.</motion.p>
          </motion.div>
          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
          >
            {team.map((member) => (
              <motion.div
                key={member.name}
                className="card-warm group !p-6 text-center"
                variants={cardHover}
                initial="rest"
                whileHover="hover"
              >
                <motion.div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--warm-ocean-light))] text-[hsl(var(--warm-ocean))]"
                  whileHover={{ scale: 1.1, rotate: 6 }}
                  transition={{ duration: 0.3 }}
                >
                  <Users weight="duotone" className="h-6 w-6" />
                </motion.div>
                <motion.h3
                  className="text-body-sm mb-1 font-semibold tracking-tight text-[hsl(var(--text-display))]"
                  whileHover={{ color: "hsl(var(--warm-ocean))" }}
                  transition={{ duration: 0.2 }}
                >
                  {member.name}
                </motion.h3>
                <p className="text-caption">{member.role}</p>
              </motion.div>
            ))}
          </motion.div>
          <motion.div
            className="mt-8 space-y-1 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <p className="text-body-sm text-[hsl(var(--text-muted))]">Orientacao: Prof. Tatiana Carla de Mattos Valerio Monteiro</p>
            <p className="text-caption">ETEC - Sao Paulo, 2026</p>
          </motion.div>
        </div>
      </section>

      {/* ODS 14 CTA */}
      <section className="section-warm">
        <div className="container-warm">
          <motion.div
            className="card-warm overflow-hidden !p-8 text-center sm:!p-12 md:!p-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={scaleIn}
          >
            <div className="relative mx-auto max-w-2xl space-y-6">
              <motion.div variants={iconFloat} animate="animate">
                <Globe className="mx-auto h-14 w-14 text-[hsl(var(--warm-ocean))]" />
              </motion.div>
              <motion.h2 className="text-headline" whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }}>
                Objetivo de Desenvolvimento Sustentavel 14
              </motion.h2>
              <motion.p className="text-body text-pretty" whileHover={{ scale: 1.01 }} transition={{ duration: 0.3 }}>
                Conservação e uso sustentável dos oceanos, dos mares e dos recursos marinhos para o desenvolvimento sustentável. O VoluntaRIO é uma contribuição direta para o alcance deste objetivo global.
              </motion.p>
              <Link to="/eventos">
                <motion.button
                  className="btn-warm-primary"
                  variants={buttonHover}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Waves className="h-4 w-4" />Encontrar eventos <ArrowRight className="h-4 w-4" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
