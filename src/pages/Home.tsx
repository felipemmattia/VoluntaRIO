import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Waves, Heart, Users, Calendar, MapPin, ArrowRight, CaretRight, CaretDown, CaretUp } from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp, fadeInDown, fadeInLeft, scaleIn, staggerContainer, cardHover, buttonHover, iconFloat, slideInFromBottom, revealText } from "@/lib/motion-variants";

function FaqItem({ question, answer, delay = 0 }: { question: string; answer: string; delay?: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={fadeInUp}
      custom={delay}
      transition={{ delay: delay * 0.001 }}
    >
      <div className="border-b" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
        <motion.button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors duration-200 hover:text-warm-ocean"
          whileHover={{ x: 4 }}
          transition={{ duration: 0.2 }}
        >
          <span className="text-body font-medium text-foreground">{question}</span>
          <motion.span
            className="shrink-0 text-muted-foreground"
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {open ? <CaretUp weight="duotone" className="h-4 w-4" /> : <CaretDown weight="duotone" className="h-4 w-4" />}
          </motion.span>
        </motion.button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <p className="pb-5 text-body-sm text-muted-foreground text-pretty">{answer}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data: categories } = trpc.category.listWithSubcategories.useQuery();
  const { data: activeOngs } = trpc.ong.listActive.useQuery();

  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation({ lat: position.coords.latitude, lon: position.coords.longitude }),
        () => setUserLocation({ lat: -23.5505, lon: -46.6333 }),
        { timeout: 5000, enableHighAccuracy: false }
      );
    } else {
      setUserLocation({ lat: -23.5505, lon: -46.6333 });
    }
  }, []);

  const coords = userLocation ?? { lat: -23.5505, lon: -46.6333 };

  const { data: recommendedEvents, isLoading: eventsLoading } = trpc.event.recommend.useQuery(
    { userLat: coords.lat, userLon: coords.lon, limit: 6 },
    { enabled: !!userLocation }
  );

  const totalOngs = activeOngs?.length ?? 0;
  const totalEvents = recommendedEvents?.length ?? 0;
  const topCategories = categories?.slice(0, 6) ?? [];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[100dvh] overflow-hidden">
        <video
          autoPlay
          muted
          playsInline
          disablePictureInPicture
          className="absolute inset-0 h-full w-full object-cover"
          style={{ pointerEvents: "none" }}
        >
          <source src="/VoluntaRIO_Video.mp4" type="video/mp4" />
        </video>
        <div className="relative z-10 flex min-h-[100dvh]">
          <div className="relative flex w-full items-center lg:w-3/4">
            <div className="absolute inset-0" style={{ background: "linear-gradient(to right, hsl(var(--warm-ocean) / 0.65) 0%, hsl(var(--warm-ocean) / 0.5) 40%, hsl(var(--warm-ocean) / 0.15) 70%, transparent 100%)" }} />
            <div className="relative w-full max-w-xl px-6 py-20 sm:px-8 lg:ml-[8%] space-y-8">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInDown}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="badge-warm" style={{ backgroundColor: "hsl(var(--warm-cream) / 0.9)" }}>
                <Waves className="h-3.5 w-3.5" />
                ODS 14 - Vida na Água
              </span>
            </motion.div>

            <motion.div
              className="space-y-5"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.h1 className="text-display text-balance" style={{ color: "hsl(var(--primary-foreground))" }} variants={fadeInUp} transition={{ delay: 0.2 }}>
                Proteja os oceanos. Comece agora.
              </motion.h1>
              <motion.p className="text-body-lg max-w-[52ch] text-pretty" style={{ color: "hsl(var(--primary-foreground) / 0.85)" }} variants={fadeInUp} transition={{ delay: 0.3 }}>
                VoluntaRIO conecta voluntários a organizações que preservam a vida marinha no Brasil. Encontre eventos próximos, acompanhe seu impacto e faça parte da mudança.
              </motion.p>
            </motion.div>

            <motion.div
              className="flex flex-wrap items-center gap-3"
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ delay: 0.4 }}
            >
              <Link to="/eventos">
                <motion.button
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200"
                  style={{ backgroundColor: "hsl(var(--primary-foreground))", color: "hsl(var(--warm-ocean))" }}
                  variants={buttonHover}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                >
                  Explorar eventos
                  <ArrowRight weight="duotone" className="h-4 w-4" />
                </motion.button>
              </Link>
              {!isAuthenticated && (
                <Link to="/login">
                  <motion.button
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 border"
                    style={{ borderColor: "hsl(var(--primary-foreground) / 0.4)", color: "hsl(var(--primary-foreground))" }}
                    variants={buttonHover}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    Criar conta
                  </motion.button>
                </Link>
              )}
            </motion.div>

            <motion.div
              className="flex flex-wrap items-center gap-10 pt-4"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              transition={{ delay: 0.5 }}
            >
              {[
                { value: totalOngs, label: "ONGs ativas" },
                { value: totalEvents, label: "Eventos proximos" },
                { value: 5, label: "Causas marinhas" },
              ].map((stat, i) => (
                <motion.div key={stat.label} className="space-y-1" variants={fadeInUp} custom={i} transition={{ delay: 0.5 + i * 0.1 }}>
                  <p className="text-metric" style={{ color: "hsl(var(--primary-foreground))" }}>{stat.value}</p>
                  <p className="text-caption" style={{ color: "hsl(var(--primary-foreground) / 0.7)" }}>{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
      </section>

      {/* How It Works */}
      <section className="section-warm" style={{ backgroundColor: "hsl(var(--surface-subtle))" }}>
        <div className="container-warm">
          <motion.div
            className="mb-14 space-y-3 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
          >
            <motion.p className="text-label" variants={fadeInUp}>Como funciona</motion.p>
            <motion.h2 className="text-headline" variants={fadeInUp}>Três passos para começar</motion.h2>
            <motion.p className="text-body-lg mx-auto max-w-[50ch] text-pretty" variants={fadeInUp}>Simples, direto e com impacto real. Veja como participar.</motion.p>
          </motion.div>

          <div className="process-rail">
            {[
              { icon: Users, step: "01", title: "Crie seu perfil", desc: "Cadastre-se como voluntário ou ONG. Preencha suas informações e escolha suas causas de interesse." },
              { icon: Calendar, step: "02", title: "Encontre eventos", desc: "Navegue por eventos filtrados por localização, causa e data. Veja a distância e detalhes de cada atividade." },
              { icon: Heart, step: "03", title: "Faça a diferença", desc: "Inscreva-se em eventos, contribua para a preservação marinha e acompanhe seu impacto ao longo do tempo." },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                className="process-rail-step"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeInLeft}
                custom={idx}
                transition={{ delay: idx * 0.15 }}
              >
                <div className="flex items-start gap-5">
                  <motion.div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warm-ocean/10 text-warm-ocean"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <item.icon className="h-5 w-5" />
                  </motion.div>
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-medium text-muted-foreground">{item.step}</span>
                      <h3 className="text-title">{item.title}</h3>
                    </div>
                    <p className="text-body max-w-[50ch] text-pretty">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section-warm">
        <div className="container-warm">
          <motion.div
            className="mb-12 space-y-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
          >
            <motion.p className="text-label" variants={fadeInUp}>Causas marinhas</motion.p>
            <motion.h2 className="text-headline text-balance" variants={fadeInUp}>Escolha sua causa e encontre eventos</motion.h2>
            <motion.p className="text-body-lg max-w-[55ch] text-pretty" variants={fadeInUp}>
              Cada causa marinha precisa de pessoas dispostas a agir. Encontre a que mais ressoa com você.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
          >
            {topCategories.map((cat, idx) => (
              <Link key={cat.id} to={`/eventos?category=${cat.id}`} className="group">
                <motion.div
                  className="card-warm-subtle"
                  variants={cardHover}
                  initial="rest"
                  whileHover="hover"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <motion.div
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{ backgroundColor: (cat.color ?? "#0EA5E9") + "18" }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Waves className="h-5 w-5" style={{ color: cat.color ?? "#0EA5E9" }} />
                    </motion.div>
                    <motion.div
                      className="text-muted-foreground"
                      whileHover={{ x: 4, color: "hsl(var(--warm-ocean))" }}
                      transition={{ duration: 0.2 }}
                    >
                      <CaretRight weight="duotone" className="h-4 w-4" />
                    </motion.div>
                  </div>
                  <motion.h3
                    className="mb-2 text-title"
                    whileHover={{ color: "hsl(var(--warm-ocean))" }}
                    transition={{ duration: 0.2 }}
                  >
                    {cat.name}
                  </motion.h3>
                  <p className="text-body text-pretty">{cat.description}</p>
                </motion.div>
              </Link>
            ))}
            {categories && categories.length > 6 && (
              <Link to="/eventos" className="flex items-center justify-center">
                <motion.div
                  className="card-warm-subtle flex h-full items-center justify-center text-center"
                  variants={cardHover}
                  initial="rest"
                  whileHover="hover"
                >
                  <div>
                    <p className="text-title text-warm-ocean">+{categories.length - 6}</p>
                    <p className="text-body-sm text-muted-foreground">ver todas</p>
                  </div>
                </motion.div>
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* Recommended Events */}
      <section className="section-warm" style={{ backgroundColor: "hsl(var(--surface-subtle))" }}>
        <div className="container-warm">
          <motion.div
            className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
          >
            <div className="space-y-2">
              <motion.p className="text-label" variants={fadeInUp}>Em destaque</motion.p>
              <motion.h2 className="text-headline" variants={fadeInUp}>Eventos próximos de você</motion.h2>
            </div>
            <Link to="/eventos">
              <motion.button
                className="btn-warm-ghost"
                variants={buttonHover}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
              >
                Ver todos <ArrowRight weight="duotone" className="h-4 w-4" />
              </motion.button>
            </Link>
          </motion.div>

          {eventsLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-56 rounded-2xl" />))}
            </div>
          ) : recommendedEvents && recommendedEvents.length > 0 ? (
            <motion.div
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={staggerContainer}
            >
              {recommendedEvents.map((event) => (
                <Link key={event.id} to={`/eventos/${event.id}`}>
                  <motion.div
                    className="card-warm group"
                    variants={cardHover}
                    initial="rest"
                    whileHover="hover"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <motion.span
                        className="badge-warm"
                        style={{ backgroundColor: (event.categoryColor ?? "#0EA5E9") + "15", color: event.categoryColor ?? "#0EA5E9" }}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        {event.categoryName}
                      </motion.span>
                      {event.distance !== null && (
                        <span className="flex items-center gap-1 text-caption text-muted-foreground">
                          <MapPin className="h-3 w-3" />{event.distance.toFixed(0)}km
                        </span>
                      )}
                    </div>
                    <motion.h3
                      className="mb-2 text-base font-semibold tracking-tight text-foreground line-clamp-2"
                      whileHover={{ color: "hsl(var(--warm-ocean))" }}
                      transition={{ duration: 0.2 }}
                    >
                      {event.title}
                    </motion.h3>
                    <p className="mb-4 text-body-sm text-muted-foreground line-clamp-2 text-pretty">{event.description}</p>
                    <div className="flex items-center justify-between text-caption text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.city}, {event.state}</span>
                      <span>{new Date(event.eventDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-caption text-muted-foreground">{event.ongName}</span>
                      <motion.span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${event.spotsLeft > 0 ? "bg-warm-ocean/10 text-warm-ocean" : "bg-destructive/10 text-destructive"}`}
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {event.spotsLeft > 0 ? `${event.enrolledCount}/${event.maxVolunteers}` : "Lotado"}
                      </motion.span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="card-warm-subtle flex flex-col items-center justify-center py-16 text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
            >
              <motion.div
                variants={iconFloat}
                animate="animate"
              >
                <Calendar className="mb-4 h-10 w-10 text-muted-foreground" />
              </motion.div>
              <p className="text-body font-medium text-foreground">Nenhum evento disponível no momento</p>
              <p className="mt-1 text-body-sm text-muted-foreground text-pretty">Novos eventos surgem como ondas — volte em breve para descobrir oportunidades.</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-warm" style={{ backgroundColor: "hsl(var(--surface-subtle))" }}>
        <div className="container-warm">
          <motion.div
            className="mb-12 space-y-3 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
          >
            <motion.p className="text-label" variants={fadeInUp}>Perguntas frequentes</motion.p>
            <motion.h2 className="text-headline" variants={fadeInUp}>Tire suas dúvidas</motion.h2>
            <motion.p className="text-body-lg mx-auto max-w-[50ch] text-pretty" variants={fadeInUp}>Tudo que você precisa saber para começar a fazer parte da comunidade VoluntaRIO.</motion.p>
          </motion.div>

          <div className="mx-auto max-w-2xl space-y-0">
            <FaqItem
               question="O que é o VoluntaRIO?"
               answer="O VoluntaRIO é uma plataforma que conecta voluntários a organizações não governamentais dedicadas à preservação da vida marinha no Brasil. Aqui você encontra eventos de voluntariado, acompanha seu impacto e faz parte de uma comunidade comprometida com os oceanos."
              delay={0}
            />
            <FaqItem
              question="Como posso me cadastrar?"
               answer="Basta clicar em Criar conta, preencher seus dados e escolher se você é um voluntário ou uma ONG. O processo é rápido, gratuito e leva menos de dois minutos."
              delay={80}
            />
            <FaqItem
              question="Os eventos sao gratuitos?"
               answer="Sim, todos os eventos listados na plataforma são gratuitos. O voluntariado é uma forma de contribuição voluntária — seu tempo e dedicação são o que importa."
              delay={160}
            />
            <FaqItem
               question="Posso participar de eventos em qualquer cidade?"
               answer="Sim! Você pode se inscrever em eventos de qualquer localização. A plataforma mostra a distância para ajudar você a escolher os mais próximos, mas não há restrição geográfica."
              delay={240}
            />
            <FaqItem
               question="Sou uma ONG. Como cadastro meus eventos?"
               answer="Após criar sua conta como ONG, você terá acesso a um painel exclusivo onde pode criar, editar e gerenciar seus eventos, acompanhar inscrições e se comunicar com voluntários."
              delay={320}
            />
            <FaqItem
               question="Recebo algum certificado de participação?"
               answer="Sim! Após participar de eventos, você pode gerar certificados digitais que comprovam suas horas de voluntariado. Eles estão disponíveis na seção de Certificados do seu perfil."
              delay={400}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-warm">
        <div className="container-warm">
          <motion.div
            className="card-warm !p-8 sm:!p-12 md:!p-16"
            style={{ backgroundColor: "hsl(var(--warm-ocean))", borderColor: "transparent" }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={slideInFromBottom}
          >
            <div className="relative mx-auto max-w-2xl text-center space-y-6">
              <motion.h2
                className="text-headline"
                style={{ color: "hsl(var(--primary-foreground))" }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                Pronto para proteger os oceanos?
              </motion.h2>
              <motion.p
                className="text-body-lg text-pretty"
                style={{ color: "hsl(var(--primary-foreground) / 0.8)" }}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.3 }}
              >
                Junte-se a voluntarios e ONGs que ja fazem parte da comunidade VoluntaRIO.
              </motion.p>
              <motion.div
                className="flex flex-wrap items-center justify-center gap-3 pt-2"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <Link to="/login">
                  <motion.button
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200"
                    style={{ backgroundColor: "hsl(var(--primary-foreground))", color: "hsl(var(--warm-ocean))" }}
                    variants={buttonHover}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Users weight="duotone" className="h-4 w-4" />Criar conta
                  </motion.button>
                </Link>
                <Link to="/eventos">
                  <motion.button
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 border"
                    style={{ borderColor: "hsl(var(--primary-foreground) / 0.4)", color: "hsl(var(--primary-foreground))" }}
                    variants={buttonHover}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Calendar weight="duotone" className="h-4 w-4" />Ver eventos
                  </motion.button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

