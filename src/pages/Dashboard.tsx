// Página de Dashboard do Voluntário: exibe as inscrições ativas, fila de espera, histórico, notificações recentes e atalhos rápidos.
import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Calendar, MapPin, CheckCircle, Clock, XCircle, ListBullets, ArrowRight, Waves, User, Gear, Bell } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { fadeInUp, fadeInDown, staggerContainer, cardHover, buttonHover, scaleIn } from "@/lib/motion-variants";

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { navigate("/login"); }
  }, [isAuthenticated, isLoading, navigate]);

  // Consultas de dados via tRPC: inscrições, notificações e informações de perfil do voluntário
  const { data: enrollments, isLoading: enrollLoading } = trpc.enrollment.myEnrollments.useQuery(undefined, { enabled: isAuthenticated });
  const { data: notifications } = trpc.notification.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: volunteerProfile } = trpc.volunteer.getMyProfile.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();

  // Mutações tRPC para marcar notificações como lidas e cancelar inscrições
  const markRead = trpc.notification.markAsRead.useMutation({ onSuccess: () => { utils.notification.list.invalidate(); } });
  const cancelEnrollment = trpc.enrollment.cancel.useMutation({ onSuccess: () => { toast.success("Inscrição cancelada"); utils.enrollment.myEnrollments.invalidate(); } });

  if (isLoading) return <motion.div className="container-warm section-warm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Skeleton className="mb-4 h-8 w-48" /><Skeleton className="h-32 rounded-2xl" /></motion.div>;
  if (!isAuthenticated) return null;

  const activeEnrollments = enrollments?.filter((e) => e.status === "accepted" || e.status === "present" || e.status === "pending");
  const pastEnrollments = enrollments?.filter((e) => e.status === "cancelled" || e.status === "rejected");
  const waitlistEnrollments = enrollments?.filter((e) => e.status === "waitlist");
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; badge: string }> = {
    accepted: { label: "Aceita", icon: CheckCircle, badge: "badge-warm" },
    present: { label: "Presente", icon: CheckCircle, badge: "badge-warm" },
    pending: { label: "Pendente", icon: Clock, badge: "badge-warm-sand" },
    waitlist: { label: "Lista de espera", icon: ListBullets, badge: "badge-warm-sand" },
    rejected: { label: "Rejeitada", icon: XCircle, badge: "badge-warm-coral" },
    cancelled: { label: "Cancelada", icon: XCircle, badge: "badge-warm-coral" },
  };

  return (
    <motion.div
      className="container-warm section-warm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="mb-10 space-y-2"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.h1 className="text-headline" variants={fadeInUp}>Painel do voluntário</motion.h1>
        <motion.p className="text-body-sm text-[hsl(var(--text-muted))]" variants={fadeInUp}>Gerencie suas inscrições, notificações e perfil.</motion.p>
      </motion.div>

      <motion.div
        className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {[
          { label: "Inscrições ativas", value: activeEnrollments?.length ?? 0, icon: CheckCircle, accent: "text-[hsl(var(--warm-ocean))]" },
          { label: "Lista de espera", value: waitlistEnrollments?.length ?? 0, icon: ListBullets, accent: "text-[hsl(var(--info))]" },
          { label: "Historico", value: pastEnrollments?.length ?? 0, icon: Calendar, accent: "text-[hsl(var(--text-muted))]" },
          { label: "Notificações", value: unreadCount, icon: Bell, accent: "text-[hsl(var(--warm-coral))]" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            className="card-warm-subtle !p-4"
            variants={fadeInUp}
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-3">
              <stat.icon className={`h-7 w-7 ${stat.accent}`} />
              <div>
                <p className="text-metric !text-[28px] !text-[hsl(var(--text-display))]">{stat.value}</p>
                <p className="text-caption">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <Tabs defaultValue="active">
            <TabsList className="mb-6 rounded-xl">
              <TabsTrigger value="active" className="rounded-lg">Ativas</TabsTrigger>
              <TabsTrigger value="waitlist" className="rounded-lg">Lista de espera</TabsTrigger>
              <TabsTrigger value="past" className="rounded-lg">Historico</TabsTrigger>
            </TabsList>
            <TabsContent value="active"><EnrollmentList enrollments={activeEnrollments} statusConfig={statusConfig} onCancel={(id) => cancelEnrollment.mutate({ id })} isLoading={enrollLoading} emptyMessage="Voce nao tem inscricoes ativas." /></TabsContent>
            <TabsContent value="waitlist"><EnrollmentList enrollments={waitlistEnrollments} statusConfig={statusConfig} onCancel={(id) => cancelEnrollment.mutate({ id })} isLoading={enrollLoading} emptyMessage="Voce nao esta em nenhuma lista de espera." /></TabsContent>
            <TabsContent value="past"><EnrollmentList enrollments={pastEnrollments} statusConfig={statusConfig} isLoading={enrollLoading} emptyMessage="Nenhum historico de inscricoes." showCancel={false} /></TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <motion.div
            className="card-warm !p-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={fadeInUp}
          >
            <div className="mb-4 flex items-center gap-2">
              <User weight="duotone" className="h-5 w-5 text-[hsl(var(--text-muted))]" />
              <h2 className="text-body font-semibold">Meu perfil</h2>
            </div>
            <div className="space-y-3">
              {volunteerProfile ? (
                <>
                  {volunteerProfile.city && volunteerProfile.state && (<div className="flex items-center gap-2 text-body-sm text-[hsl(var(--text-muted))]"><MapPin weight="duotone" className="h-4 w-4" />{volunteerProfile.city}, {volunteerProfile.state}</div>)}
                  {volunteerProfile.bio && (<p className="text-body-sm leading-relaxed text-[hsl(var(--text-body))] line-clamp-3 text-pretty">{volunteerProfile.bio}</p>)}
                  {volunteerProfile.interests && (<div className="flex flex-wrap gap-1.5">{volunteerProfile.interests.split(",").slice(0, 5).map((interest) => (<motion.span key={interest} className="badge-warm-sand" whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>{interest.trim()}</motion.span>))}</div>)}
                </>
              ) : (<p className="text-body-sm text-[hsl(var(--text-muted))]">Perfil incompleto. Complete suas informações.</p>)}
              <Link to="/perfil"><motion.button className="btn-warm-secondary w-full mt-2" variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap"><Gear weight="duotone" className="h-3.5 w-3.5" />Editar perfil</motion.button></Link>
            </div>
          </motion.div>

          <motion.div
            className="card-warm !p-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={fadeInUp}
          >
            <div className="mb-4 flex items-center gap-2">
              <Bell weight="duotone" className="h-5 w-5 text-[hsl(var(--text-muted))]" />
              <h2 className="text-body font-semibold">Notificações</h2>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {notifications && notifications.length > 0 ? (
                notifications.slice(0, 8).map((notif, i) => (
                  <motion.button
                    key={notif.id}
                    type="button"
                    className={`group w-full rounded-xl p-3 text-left transition-all duration-200 ${notif.read ? "bg-[hsl(var(--muted))/30] hover:bg-[hsl(var(--muted))/50]" : "bg-[hsl(var(--warm-ocean))/5] hover:bg-[hsl(var(--warm-ocean))/10]"}`}
                    onClick={() => { if (!notif.read) markRead.mutate({ id: notif.id }); }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ x: 4 }}
                  >
                    <p className="text-caption font-semibold transition-colors group-hover:text-[hsl(var(--warm-ocean))]">{notif.title}</p>
                    <p className="mt-0.5 text-caption text-[hsl(var(--text-muted))] line-clamp-2 text-pretty">{notif.message}</p>
                  </motion.button>
                ))
              ) : (<p className="py-6 text-center text-body-sm text-[hsl(var(--text-muted))]">Mar calmo — nenhuma notificação pendente.</p>)}
            </div>
          </motion.div>

          <motion.div
            className="card-warm-subtle !p-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={fadeInUp}
          >
            <h2 className="mb-4 text-body font-semibold">Ações rápidas</h2>
            <div className="space-y-1">
              {[
                { to: "/eventos", icon: Waves, label: "Explorar eventos" },
                { to: "/mensagens", icon: Bell, label: "Mensagens" },
                { to: "/ong", icon: Waves, label: "Sou uma ONG" },
              ].map((action, i) => (
                <Link key={action.to} to={action.to}>
                  <motion.button
                    className="btn-warm-ghost w-full justify-between flex items-center gap-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="flex items-center gap-2"><action.icon className="h-4 w-4" />{action.label}</span><ArrowRight weight="duotone" className="h-3.5 w-3.5" />
                  </motion.button>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// Componente que renderiza a lista de inscrições do voluntário de acordo com a aba selecionada (Ativas, Espera, Histórico)
function EnrollmentList({ enrollments, statusConfig, onCancel, isLoading, emptyMessage, showCancel = true }: {
  enrollments?: Array<{ id: number; eventId: number; status: string; position: number | null; eventTitle: string; eventDate: Date | null; eventLocation: string; ongName: string }>;
  statusConfig: Record<string, { label: string; icon: typeof CheckCircle; badge: string }>;
  onCancel?: (id: number) => void;
  isLoading: boolean;
  emptyMessage: string;
  showCancel?: boolean;
}) {
  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map((i) => (<Skeleton key={i} className="h-20 rounded-2xl" />))}</div>;
  if (!enrollments || enrollments.length === 0) {
    return (
      <motion.div
        className="card-warm-subtle flex flex-col items-center justify-center py-16 text-center"
        initial="hidden"
        animate="visible"
        variants={scaleIn}
      >
        <motion.div variants={fadeInUp}>
          <Calendar weight="duotone" className="mb-4 h-10 w-10 text-[hsl(var(--text-muted))]" />
        </motion.div>
        <motion.p className="text-body-sm font-semibold text-[hsl(var(--text-display))]" variants={fadeInUp}>Nenhuma inscricao ativa ainda</motion.p>
        <motion.p className="mt-1 text-body-sm text-[hsl(var(--text-muted))] text-pretty" variants={fadeInUp}>O oceano espera por voce. Explore eventos e faca sua primeira inscricao.</motion.p>
        <motion.div variants={fadeInUp}>
          <Link to="/eventos"><motion.button className="btn-warm-secondary mt-4 gap-2" variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap"><Waves weight="duotone" className="h-3.5 w-3.5" />Encontrar eventos</motion.button></Link>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-3"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {enrollments.map((enrollment) => {
        const config = statusConfig[enrollment.status] ?? statusConfig.pending;
        const StatusIcon = config.icon;
        return (
          <motion.div
            key={enrollment.id}
            className="card-warm !p-4"
            variants={cardHover}
            initial="rest"
            whileHover="hover"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <Link to={`/eventos/${enrollment.eventId}`}><motion.h3 className="text-title !text-[1.1rem] text-[hsl(var(--text-display))]" whileHover={{ color: "hsl(var(--warm-ocean))" }} transition={{ duration: 0.2 }}>{enrollment.eventTitle}</motion.h3></Link>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-[hsl(var(--text-muted))]">
                  <span className="flex items-center gap-1"><Calendar weight="duotone" className="h-3.5 w-3.5" />{enrollment.eventDate ? new Date(enrollment.eventDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "Data nao definida"}</span>
                  <span className="flex items-center gap-1"><MapPin weight="duotone" className="h-3.5 w-3.5" />{enrollment.eventLocation}</span>
                  <span>{enrollment.ongName}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <motion.span className={config.badge} whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}><StatusIcon className="h-3 w-3" />{config.label}{enrollment.position ? ` #${enrollment.position}` : ""}</motion.span>
                {showCancel && onCancel && (<motion.button type="button" onClick={() => onCancel(enrollment.id)} className="h-7 rounded-xl text-xs text-[hsl(var(--warm-coral))] hover:bg-[hsl(var(--warm-coral))/10] px-3 transition-all" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.2 }}>Cancelar</motion.button>)}
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
