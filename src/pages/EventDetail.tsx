import { useParams, Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { MapPin, Calendar, Clock, Users, BuildingOffice, ArrowLeft, Warning, Globe, Envelope, Phone, Images } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { useState } from "react";
import { fadeInUp, fadeInDown, staggerContainer, buttonHover, scaleIn } from "@/lib/motion-variants";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const eventId = parseInt(id ?? "0");
  const { isAuthenticated } = useAuth();
  const [showOngInfo, setShowOngInfo] = useState(false);

  const { data: event, isLoading } = trpc.event.getById.useQuery({ id: eventId }, { enabled: eventId > 0 });
  const { data: myEnrollments } = trpc.enrollment.myEnrollments.useQuery(undefined, { enabled: isAuthenticated });
  const { data: eventImages } = trpc.eventGallery.list.useQuery({ eventId }, { enabled: eventId > 0 });
  const { data: ongImages } = trpc.eventGallery.list.useQuery({ eventId: event?.id ?? 0 }, { enabled: !!event?.id });
  const utils = trpc.useUtils();

  const enrollMutation = trpc.enrollment.create.useMutation({
    onSuccess: (data) => {
      const statusMsg = data.status === "accepted" ? "Inscrição aceita! Prepare-se para fazer a diferença." : data.status === "waitlist" ? "Você entrou na lista de espera. Fique atento — vagas podem abrir." : "Inscrição enviada! Aguarde a confirmação da ONG.";
      toast.success(statusMsg);
      utils.enrollment.myEnrollments.invalidate();
      utils.event.getById.invalidate({ id: eventId });
    },
    onError: (err) => { toast.error(err.message); },
  });

  const cancelMutation = trpc.enrollment.cancel.useMutation({
    onSuccess: () => { toast.success("Inscrição cancelada"); utils.enrollment.myEnrollments.invalidate(); utils.event.getById.invalidate({ id: eventId }); },
    onError: (err) => { toast.error(err.message); },
  });

  const myEnrollment = myEnrollments?.find((e) => e.eventId === eventId);
  const isFull = event ? (event.enrolledCount ?? 0) >= event.maxVolunteers : false;

  const handleEnroll = () => { if (!isAuthenticated) { toast.info("Faça login para se inscrever"); return; } enrollMutation.mutate({ eventId }); };
  const handleCancel = () => { if (myEnrollment) { cancelMutation.mutate({ id: myEnrollment.id }); } };

  const EXPERIENCE_LABELS: Record<string, string> = { iniciante: "Iniciante", intermediario: "Intermediário", avancado: "Avançado", todos: "Todos os níveis" };

  if (isLoading) {
    return (
      <motion.div
        className="container-warm section-warm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Skeleton className="mb-4 h-8 w-32" /><Skeleton className="mb-4 h-12 w-3/4" /><Skeleton className="h-64 rounded-2xl" />
      </motion.div>
    );
  }

  if (!event) {
    return (
      <motion.div
        className="container-warm section-warm text-center"
        initial="hidden"
        animate="visible"
        variants={scaleIn}
      >
        <motion.div variants={fadeInUp}>
          <Warning weight="duotone" className="mx-auto mb-4 h-12 w-12 text-[hsl(var(--text-muted))]" />
        </motion.div>
        <motion.h1 className="mb-2 text-headline" variants={fadeInUp}>Evento não encontrado</motion.h1>
        <motion.p className="mb-6 text-body text-pretty" variants={fadeInUp}>O evento que você procura não existe ou foi removido.</motion.p>
        <motion.div variants={fadeInUp}>
          <Link to="/eventos"><motion.button className="btn-warm-secondary gap-2" variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap"><ArrowLeft weight="duotone" className="h-3.5 w-3.5" />Voltar para Eventos</motion.button></Link>
        </motion.div>
      </motion.div>
    );
  }

  const spotsPercentage = Math.min(100, ((event.enrolledCount ?? 0) / event.maxVolunteers) * 100);

  return (
    <motion.div
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container-warm section-warm">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link to="/eventos" className="btn-warm-ghost mb-8">
            <ArrowLeft weight="duotone" className="h-3.5 w-3.5" />Voltar para eventos
          </Link>
        </motion.div>

        <motion.div
          className="mb-12"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div className="mb-5 flex flex-wrap items-center gap-2" variants={fadeInUp}>
            <motion.span className="badge-warm-coral" whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>{event.category?.name ?? "Categoria"}</motion.span>
            <motion.span className={event.status === "active" ? "badge-warm" : "badge-warm-sand"} whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>{event.status === "active" ? "Ativo" : event.status === "completed" ? "Concluído" : event.status === "cancelled" ? "Cancelado" : event.status === "draft" ? "Rascunho" : event.status}</motion.span>
            <motion.span className="badge-warm-sand" whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>{EXPERIENCE_LABELS[event.experienceLevel] ?? event.experienceLevel}</motion.span>
          </motion.div>
          <motion.h1 className="text-display" variants={fadeInUp}>{event.title}</motion.h1>
        </motion.div>

        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-14">
            {/* Gallery Section */}
            {eventImages && eventImages.length > 0 && (
              <motion.div
                className="space-y-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={staggerContainer}
              >
                <motion.div className="divider-warm" variants={fadeInUp} />
                <motion.h2 className="text-title" variants={fadeInUp}>Galeria de fotos</motion.h2>
                <motion.div className="grid grid-cols-2 gap-3 sm:grid-cols-3" variants={fadeInUp}>
                  {eventImages.map((img) => (
                    <motion.div
                      key={img.id}
                      className="group relative overflow-hidden rounded-xl"
                      whileHover={{ scale: 1.03 }}
                      transition={{ duration: 0.2 }}
                    >
                      <img src={img.imageUrl} alt={img.caption ?? ""} className="h-40 w-full object-cover" />
                      {img.caption && (
                        <p className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-xs text-white">{img.caption}</p>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {event.description && (
              <motion.div
                className="space-y-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={staggerContainer}
              >
                <motion.div className="divider-warm" variants={fadeInUp} />
                <motion.h2 className="text-title" variants={fadeInUp}>Sobre o evento</motion.h2>
                <motion.p className="text-body-lg text-pretty whitespace-pre-wrap" variants={fadeInUp}>{event.description}</motion.p>
              </motion.div>
            )}
            {event.requirements && (
              <motion.div
                className="space-y-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={staggerContainer}
              >
                <motion.div className="divider-warm" variants={fadeInUp} />
                <motion.h2 className="text-title" variants={fadeInUp}>Requisitos</motion.h2>
                <motion.p className="text-body-lg text-pretty whitespace-pre-wrap" variants={fadeInUp}>{event.requirements}</motion.p>
              </motion.div>
            )}
            {event.ong && (
              <motion.div
                className="card-warm"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeInUp}
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <BuildingOffice weight="duotone" className="h-5 w-5 text-[hsl(var(--warm-ocean))]" />
                    <h2 className="text-title">Organização</h2>
                  </div>
                  <motion.button
                    className="btn-warm-secondary !px-3 !py-1.5 text-xs font-semibold"
                    onClick={() => setShowOngInfo(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Ver mais informações
                  </motion.button>
                </div>
                <div className="flex items-start gap-4">
                  {(event.ong as any).avatar ? (
                    <img src={(event.ong as any).avatar} alt={event.ong.displayName} className="h-14 w-14 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--warm-ocean-light))]">
                      <BuildingOffice weight="duotone" className="h-6 w-6 text-[hsl(var(--warm-ocean))]" />
                    </div>
                  )}
                  <div className="space-y-3 min-w-0">
                  <h3 className="text-body-lg font-semibold text-[hsl(var(--text-display))]">{event.ong.displayName}</h3>
                  {event.ong.mission && (<p className="text-body text-pretty">{event.ong.mission}</p>)}
                  <div className="flex flex-wrap gap-4 text-body-sm text-[hsl(var(--text-body))]">
                    {event.ong.city && event.ong.state && (<span className="flex items-center gap-1.5"><MapPin weight="duotone" className="h-4 w-4" />{event.ong.city}, {event.ong.state}</span>)}
                    {event.ong.website && (<a href={event.ong.website} target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--warm-ocean))] underline decoration-[hsl(var(--warm-ocean))/0.3] underline-offset-2 transition-colors hover:text-[hsl(var(--warm-ocean-hover))]">{event.ong.website}</a>)}
                  </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={fadeInUp}
          >
            <div className="card-warm sticky top-24 space-y-6">
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "100%" }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-label">Vagas</span>
                  <span className="text-metric text-[1.125rem] text-[hsl(var(--warm-ocean))]">{event.enrolledCount}<span className="text-[hsl(var(--text-muted))]">/{event.maxVolunteers}</span></span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[hsl(var(--warm-sand))]">
                  <motion.div
                    className="h-full rounded-full bg-[hsl(var(--warm-ocean))]"
                    initial={{ width: 0 }}
                    animate={{ width: `${spotsPercentage}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                {isFull && (<p className="mt-3 flex items-center gap-1.5 text-caption text-[hsl(var(--warm-coral))]"><Warning weight="duotone" className="h-3.5 w-3.5" />Lista de espera disponível</p>)}
              </motion.div>

              <div className="divider-warm" />

              <div className="space-y-3.5 text-body-sm text-[hsl(var(--text-body))]">
                <motion.div className="flex items-start gap-3" whileHover={{ x: 4 }} transition={{ duration: 0.2 }}><Calendar weight="duotone" className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--warm-ocean))]" /><span>{new Date(event.eventDate).toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span></motion.div>
                {event.eventTime && (<motion.div className="flex items-center gap-3" whileHover={{ x: 4 }} transition={{ duration: 0.2 }}><Clock weight="duotone" className="h-4 w-4 shrink-0 text-[hsl(var(--warm-ocean))]" /><span>{event.eventTime}</span></motion.div>)}
                {event.duration && (<motion.div className="flex items-center gap-3" whileHover={{ x: 4 }} transition={{ duration: 0.2 }}><Clock weight="duotone" className="h-4 w-4 shrink-0 text-[hsl(var(--warm-ocean))]" /><span>Duração: {event.duration}</span></motion.div>)}
                <motion.div className="flex items-start gap-3" whileHover={{ x: 4 }} transition={{ duration: 0.2 }}><MapPin weight="duotone" className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--warm-ocean))]" /><span>{event.locationName ?? event.address ?? `${event.city}, ${event.state}`}</span></motion.div>
                <motion.div className="flex items-center gap-3" whileHover={{ x: 4 }} transition={{ duration: 0.2 }}><Users weight="duotone" className="h-4 w-4 shrink-0 text-[hsl(var(--warm-ocean))]" /><span>Nível: {EXPERIENCE_LABELS[event.experienceLevel]}</span></motion.div>
              </div>

              <div className="divider-warm" />

              {myEnrollment ? (
                <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                  <motion.span
                    className={`inline-flex w-full justify-center rounded-full px-3 py-2 text-xs font-semibold ${myEnrollment.status === "accepted" || myEnrollment.status === "present" ? "badge-warm" : myEnrollment.status === "waitlist" ? "badge-warm-sand" : "badge-warm-coral"}`}
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.2 }}
                  >
                    {myEnrollment.status === "present" && "Presença confirmada"}{myEnrollment.status === "accepted" && "Inscrito"}{myEnrollment.status === "pending" && "Inscrição pendente"}{myEnrollment.status === "waitlist" && `Lista de espera #${myEnrollment.position}`}
                  </motion.span>
                  {myEnrollment.status !== "cancelled" && myEnrollment.status !== "present" && (<motion.button type="button" className="btn-warm-secondary w-full" onClick={handleCancel} disabled={cancelMutation.isPending} variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap">Cancelar inscrição</motion.button>)}
                </motion.div>
              ) : (
                <motion.button
                  className="btn-warm-primary w-full"
                  onClick={handleEnroll}
                  disabled={enrollMutation.isPending || event.status === "cancelled"}
                  variants={buttonHover}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                  transition={{ delay: 0.6 }}
                >
                  {isFull ? "Entrar na lista de espera" : "Inscrever-se"}
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* --- ONG INFO DIALOG --- */}
      <Dialog open={showOngInfo} onOpenChange={setShowOngInfo}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-title">{event?.ong?.displayName}</DialogTitle>
          </DialogHeader>
          {event?.ong && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4 pb-2 border-b border-[hsl(var(--border)/0.5)]">
                {(event.ong as any).avatar ? (
                  <img src={(event.ong as any).avatar} alt={event.ong.displayName} className="h-16 w-16 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--warm-ocean-light))]">
                    <BuildingOffice weight="duotone" className="h-7 w-7 text-[hsl(var(--warm-ocean))]" />
                  </div>
                )}
                <div>
                  <h3 className="text-title">{event.ong.displayName}</h3>
                  {event.ong.mission && <p className="text-body-sm text-[hsl(var(--text-muted))] text-pretty">{event.ong.mission}</p>}
                </div>
              </div>
              {event.ong.description && (
                <div className="space-y-2">
                  <h3 className="text-label">Sobre</h3>
                  <p className="text-body text-pretty">{event.ong.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-body-sm">
                {event.ong.city && event.ong.state && (
                  <div className="flex items-center gap-2">
                    <MapPin weight="duotone" className="h-4 w-4 text-[hsl(var(--warm-ocean))]" />
                    <span>{event.ong.city}, {event.ong.state}</span>
                  </div>
                )}
                {event.ong.email && (
                  <div className="flex items-center gap-2">
                    <Envelope weight="duotone" className="h-4 w-4 text-[hsl(var(--warm-ocean))]" />
                    <span>{event.ong.email}</span>
                  </div>
                )}
                {event.ong.phone && (
                  <div className="flex items-center gap-2">
                    <Phone weight="duotone" className="h-4 w-4 text-[hsl(var(--warm-ocean))]" />
                    <span>{event.ong.phone}</span>
                  </div>
                )}
                {event.ong.website && (
                  <div className="flex items-center gap-2">
                    <Globe weight="duotone" className="h-4 w-4 text-[hsl(var(--warm-ocean))]" />
                    <a href={event.ong.website} target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--warm-ocean))] underline">{event.ong.website}</a>
                  </div>
                )}
              </div>
              {event.ong.address && (
                <div className="space-y-2">
                  <h3 className="text-label">Endereço</h3>
                  <p className="text-body">{event.ong.address}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
