// Página de Notificações: gerencia e exibe alertas, mudanças de status em inscrições e mensagens importantes para voluntários e ONGs.
import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Bell, Check, Trash, ArrowLeft, Warning } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { fadeInUp, fadeInDown, staggerContainer, buttonHover, scaleIn } from "@/lib/motion-variants";

export default function Notifications() {
  const { isAuthenticated, isLoading: authLoading, isOngManager } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [isAuthenticated, authLoading, navigate]);

  const { data: notifications, isLoading } = trpc.notification.list.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();

  const markRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => { utils.notification.list.invalidate(); utils.notification.getUnreadCount.invalidate(); },
  });
  const markAllRead = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => { utils.notification.list.invalidate(); utils.notification.getUnreadCount.invalidate(); toast.success("Notificações marcadas como lidas"); },
  });
  const removeNotif = trpc.notification.delete.useMutation({
    onSuccess: () => { utils.notification.list.invalidate(); utils.notification.getUnreadCount.invalidate(); },
  });

  if (authLoading) return null;
  if (!isAuthenticated) return null;

  const unread = notifications?.filter((n) => !n.read) ?? [];
  const read = notifications?.filter((n) => n.read) ?? [];

  return (
    <motion.div
      className="container-warm section-warm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="mb-8 space-y-2"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={isOngManager ? "/ong/dashboard" : "/dashboard"} className="btn-warm-ghost rounded-xl p-2">
              <ArrowLeft weight="duotone" className="h-4 w-4" />
            </Link>
            <div>
              <motion.h1 className="text-headline" variants={fadeInUp}>Notificações</motion.h1>
              <motion.p className="text-body-sm text-[hsl(var(--text-muted))]" variants={fadeInUp}>
                {notifications ? (unread.length > 0 ? `${unread.length} não lida${unread.length > 1 ? "s" : ""}` : "Todas lidas") : "Carregando..."}
              </motion.p>
            </div>
          </div>
          {unread.length > 0 && (
            <motion.button
              className="btn-warm-secondary !px-3 !py-1.5 text-xs"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              variants={buttonHover}
              whileHover="hover"
              whileTap="tap"
            >
              <Check weight="duotone" className="h-3 w-3" />
              Marcar todas como lidas
            </motion.button>
          )}
        </div>
      </motion.div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : notifications && notifications.length > 0 ? (
        <motion.div className="space-y-2" initial="hidden" animate="visible" variants={staggerContainer}>
          {notifications.map((notif, i) => (
            <motion.div
              key={notif.id}
              className={`card-warm flex items-start gap-3 !p-4 ${!notif.read ? "border-l-4 border-l-[hsl(var(--warm-ocean))]" : ""}`}
              variants={fadeInUp}
              custom={i}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${!notif.read ? "bg-[hsl(var(--warm-ocean))/10]" : "bg-[hsl(var(--muted))]"}`}>
                <Bell weight="duotone" className={`h-4 w-4 ${!notif.read ? "text-[hsl(var(--warm-ocean))]" : "text-[hsl(var(--text-muted))]"}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`text-body-sm ${!notif.read ? "font-semibold" : ""}`}>{notif.title}</p>
                    <p className="mt-0.5 text-caption text-[hsl(var(--text-muted))] text-pretty">{notif.message}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-[hsl(var(--text-muted))]">
                    {new Date(notif.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  {!notif.read && (
                    <motion.button
                      className="text-[11px] font-medium text-[hsl(var(--warm-ocean))] hover:underline"
                      onClick={() => markRead.mutate({ id: notif.id })}
                      whileHover={{ x: 2 }}
                    >
                      Marcar como lida
                    </motion.button>
                  )}
                  {notif.link && (
                    <Link to={notif.link} className="text-[11px] font-medium text-[hsl(var(--warm-ocean))] hover:underline">
                      Ver evento
                    </Link>
                  )}
                </div>
              </div>
              <motion.button
                className="h-6 w-6 shrink-0 rounded-full text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--warm-coral))/10] hover:text-[hsl(var(--warm-coral))] flex items-center justify-center"
                onClick={() => removeNotif.mutate({ id: notif.id })}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Trash weight="duotone" className="h-3 w-3" />
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          className="flex flex-col items-center justify-center py-20 text-center"
          initial="hidden"
          animate="visible"
          variants={scaleIn}
        >
          <motion.div variants={fadeInUp}>
            <Bell weight="duotone" className="mx-auto mb-4 h-12 w-12 text-[hsl(var(--text-muted))]" />
          </motion.div>
          <motion.h2 className="text-title mb-1" variants={fadeInUp}>Nenhuma notificação</motion.h2>
          <motion.p className="text-body-sm text-[hsl(var(--text-muted))] text-pretty max-w-sm" variants={fadeInUp}>
            Você receberá notificações sobre eventos, inscrições e atualizações da plataforma aqui.
          </motion.p>
        </motion.div>
      )}
    </motion.div>
  );
}
