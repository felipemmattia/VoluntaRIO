import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Plus,
  BuildingOffice,
  Calendar,
  Users,
  MapPin,
  Trash,
  Gear,
  ChartBar,
  Waves,
  CheckCircle,
  XCircle,
  Clock,
  ListBullets,
  Image as ImageIcon,
  Images,
  Building,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp, fadeInDown, staggerContainer, cardHover, buttonHover, scaleIn } from "@/lib/motion-variants";

const BRAZIL_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export default function OngDashboard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [selectedEventForEnrollments, setSelectedEventForEnrollments] = useState<number | null>(null);
  const [selectedEventForOngInfo, setSelectedEventForOngInfo] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const { data: ongProfile } = trpc.ong.getByUserId.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user?.id }
  );

  const { data: ongEvents } = trpc.event.listByOng.useQuery(
    { ongId: ongProfile?.id ?? 0 },
    { enabled: !!ongProfile?.id }
  );

  const utils = trpc.useUtils();

  const createOng = trpc.ong.create.useMutation({
    onSuccess: () => {
      toast.success("ONG criada com sucesso");
      utils.ong.getByUserId.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const createEvent = trpc.event.create.useMutation({
    onSuccess: () => {
      toast.success("Evento criado! Voluntários já podem se inscrever.");
      setShowCreateEvent(false);
      utils.event.listByOng.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteEvent = trpc.event.delete.useMutation({
    onSuccess: () => {
      toast.success("Evento deletado");
      utils.event.listByOng.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return null;
  if (!isAuthenticated) return null;

  if (!ongProfile) {
    return (
      <motion.div
        className="flex min-h-[100dvh] items-center justify-center bg-[hsl(var(--surface-subtle))] p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full max-w-md space-y-6">
          <motion.div
            className="space-y-2 text-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInDown}>
              <BuildingOffice weight="duotone" className="mx-auto h-12 w-12 text-[hsl(var(--warm-ocean))]" />
            </motion.div>
            <motion.h1 className="text-title" variants={fadeInUp}>Cadastrar ONG</motion.h1>
            <motion.p className="text-body-sm text-[hsl(var(--text-muted))] text-pretty" variants={fadeInUp}>
              Crie o perfil da sua organização para começar a publicar eventos.
            </motion.p>
          </motion.div>

          <motion.div
            className="card-warm p-6"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.3 }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const data = new FormData(form);
                createOng.mutate({
                  displayName: data.get("displayName") as string,
                  mission: data.get("mission") as string,
                  description: data.get("description") as string,
                  cnpj: data.get("cnpj") as string,
                  city: data.get("city") as string,
                  state: data.get("state") as string,
                  phone: data.get("phone") as string,
                  email: data.get("email") as string,
                  website: data.get("website") as string,
                  address: data.get("address") as string,
                  autoAccept: data.get("autoAccept") === "on",
                });
              }}
              className="space-y-4"
            >
              {[
                { id: "displayName", label: "Nome da ONG", type: "text" },
                { id: "mission", label: "Missão", type: "textarea" },
                { id: "description", label: "Descrição", type: "textarea" },
                { id: "cnpj", label: "CNPJ", type: "text" },
              ].map((field, i) => (
                <motion.div
                  key={field.id}
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  <Label htmlFor={field.id} className="text-label">{field.label}</Label>
                  {field.type === "textarea" ? (
                    <textarea id={field.id} name={field.id} className="input-warm !py-2.5 !min-h-[60px]" />
                  ) : (
                    <motion.input
                      id={field.id}
                      name={field.id}
                      className="input-warm"
                      whileFocus={{ scale: 1.005, borderColor: "hsl(var(--warm-ocean))" }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </motion.div>
              ))}
              <motion.div
                className="grid grid-cols-2 gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-label">Cidade</Label>
                  <motion.input id="city" name="city" className="input-warm" whileFocus={{ scale: 1.005, borderColor: "hsl(var(--warm-ocean))" }} transition={{ duration: 0.2 }} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-label">Estado (UF)</Label>
                  <select id="state" name="state" required className="input-warm">
                    <option value="">Selecione</option>
                    {BRAZIL_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                <Switch id="autoAccept" name="autoAccept" />
                <Label htmlFor="autoAccept" className="text-body-sm font-normal">Aceitar voluntários automaticamente</Label>
              </motion.div>
              <motion.button
                type="submit"
                className="btn-warm-primary w-full"
                disabled={createOng.isPending}
                variants={buttonHover}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                transition={{ delay: 1 }}
              >
                {createOng.isPending ? "Criando..." : "Criar ONG"}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  const activeCount = ongEvents?.filter((e) => e.status === "active").length ?? 0;
  const completedCount = ongEvents?.filter((e) => e.status === "completed").length ?? 0;

  return (
    <motion.div
      className="container-warm section-warm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <motion.div variants={fadeInUp}>
            <h1 className="text-headline">{ongProfile.displayName}</h1>
            <div className="mt-1 flex items-center gap-2 text-body-sm text-[hsl(var(--text-muted))]">
              <MapPin weight="duotone" className="h-4 w-4" />
              {ongProfile.city}, {ongProfile.state}
              <span className="badge-warm-sand">{ongProfile.status === "active" ? "Ativo" : ongProfile.status === "pending" ? "Pendente" : ongProfile.status === "suspended" ? "Suspenso" : ongProfile.status}</span>
            </div>
          </motion.div>
          <motion.div variants={fadeInUp}>
            <Dialog open={showCreateEvent} onOpenChange={setShowCreateEvent}>
              <DialogTrigger asChild>
                <motion.button className="btn-warm-primary gap-2" variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap">
                  <Plus weight="duotone" className="h-4 w-4" />
                  Novo evento
                </motion.button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-title">Criar novo evento</DialogTitle>
                </DialogHeader>
                <CreateEventForm
                  onSubmit={(data) => {
                    createEvent.mutate(data);
                    setShowCreateEvent(false);
                  }}
                  isPending={createEvent.isPending}
                />
              </DialogContent>
            </Dialog>
          </motion.div>
        </div>

        <motion.div
          className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {[
            { label: "Total eventos", value: ongEvents?.length ?? 0, icon: Calendar },
            { label: "Ativos", value: activeCount, icon: Waves },
            { label: "Concluídos", value: completedCount, icon: ChartBar },
            { label: "Aceitação", value: ongProfile.autoAccept ? "Automática" : "Manual", icon: Gear },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              className="card-warm-subtle !p-4"
              variants={fadeInUp}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3">
                <stat.icon className="h-7 w-7 text-[hsl(var(--warm-ocean))]" />
                <div>
                  <p className="text-metric !text-[28px]">{typeof stat.value === "number" ? stat.value : <span className="!text-[1.1rem]">{stat.value}</span>}</p>
                  <p className="text-caption">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="space-y-4">
          <motion.h2 className="text-title" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>Meus eventos</motion.h2>
          {ongEvents && ongEvents.length > 0 ? (
            <motion.div
              className="space-y-3"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              {ongEvents.map((event) => (
                <motion.div
                  key={event.id}
                  className="card-warm !p-4"
                  variants={cardHover}
                  initial="rest"
                  whileHover="hover"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <motion.h3 className="text-title !text-[1.1rem]" whileHover={{ color: "hsl(var(--warm-ocean))" }} transition={{ duration: 0.2 }}>{event.title}</motion.h3>
                        <motion.span className={event.status === "active" ? "badge-warm" : "badge-warm-sand"} whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                          {event.status === "active" ? "Ativo" : event.status === "completed" ? "Concluído" : event.status === "cancelled" ? "Cancelado" : event.status === "draft" ? "Rascunho" : event.status}
                        </motion.span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-body-sm text-[hsl(var(--text-muted))]">
                        <span className="flex items-center gap-1">
                          <Calendar weight="duotone" className="h-3.5 w-3.5" />
                          {new Date(event.eventDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin weight="duotone" className="h-3.5 w-3.5" />
                          {event.city}, {event.state}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users weight="duotone" className="h-3.5 w-3.5" />
                          {event.maxVolunteers} vagas
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Link to={`/eventos/${event.id}`}>
                        <motion.button className="btn-warm-secondary" variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap">
                          Ver
                        </motion.button>
                      </Link>
                      <EventPhotoManager eventId={event.id} />
                      <motion.button
                        className="btn-warm-secondary h-8 w-8 !p-0 text-[hsl(var(--warm-coral))] hover:bg-[hsl(var(--warm-coral))/10] hover:border-[hsl(var(--warm-coral))/30]"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja deletar este evento?")) {
                            deleteEvent.mutate({ id: event.id });
                          }
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Trash weight="duotone" className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="card-warm-subtle flex flex-col items-center justify-center py-16 text-center"
              initial="hidden"
              animate="visible"
              variants={scaleIn}
            >
              <motion.div variants={fadeInUp}>
                <Calendar weight="duotone" className="mb-4 h-10 w-10 text-[hsl(var(--text-muted))]" />
              </motion.div>
              <motion.p className="mb-1 text-body-sm font-semibold text-[hsl(var(--text-display))]" variants={fadeInUp}>Nenhum evento criado ainda</motion.p>
              <motion.p className="mb-4 text-body-sm text-[hsl(var(--text-muted))] text-pretty" variants={fadeInUp}>
                Seu primeiro evento é o começo de um impacto maior. Crie agora e conecte-se com voluntários.
              </motion.p>
              <motion.button
                onClick={() => setShowCreateEvent(true)}
                className="btn-warm-primary gap-2"
                variants={buttonHover}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
              >
                <Plus weight="duotone" className="h-4 w-4" />
                Criar primeiro evento
              </motion.button>
            </motion.div>
          )}
        </div>

        {/* --- INSCRICOES PENDENTES --- */}
        <div className="mt-8 space-y-4">
          <motion.h2 className="text-title" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            Inscrições para revisar
          </motion.h2>
          {ongEvents?.map((event) => (
            <EventEnrollmentsManager key={event.id} eventId={event.id} eventTitle={event.title} />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function EventEnrollmentsManager({ eventId, eventTitle }: { eventId: number; eventTitle: string }) {
  const { data: enrollments } = trpc.enrollment.listByEvent.useQuery({ eventId });
  const utils = trpc.useUtils();
  const updateStatus = trpc.enrollment.updateStatus.useMutation({
    onSuccess: () => {
      utils.enrollment.listByEvent.invalidate({ eventId });
      utils.enrollment.getEventStats.invalidate({ eventId });
    },
  });

  const pending = enrollments?.filter(e => e.status === "pending") ?? [];
  const accepted = enrollments?.filter(e => e.status === "accepted") ?? [];
  const hasAny = pending.length > 0 || accepted.length > 0;
  if (!hasAny) return null;

  const statusIcon = (status: string) => {
    switch (status) {
      case "accepted": return <CheckCircle weight="duotone" className="h-4 w-4 text-[hsl(var(--success))]" />;
      case "present": return <CheckCircle weight="duotone" className="h-4 w-4 text-[hsl(var(--info))]" />;
      case "rejected": return <XCircle weight="duotone" className="h-4 w-4 text-[hsl(var(--warm-coral))]" />;
      case "waitlist": return <ListBullets weight="duotone" className="h-4 w-4 text-[hsl(var(--info))]" />;
      default: return <Clock weight="duotone" className="h-4 w-4 text-[hsl(var(--text-muted))]" />;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "accepted": return "Aceito";
      case "present": return "Presente";
      case "rejected": return "Rejeitado";
      case "waitlist": return "Lista de espera";
      case "cancelled": return "Cancelado";
      default: return "Pendente";
    }
  };

  return (
    <motion.div
      className="card-warm !p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar weight="duotone" className="h-5 w-5 text-[hsl(var(--warm-ocean))]" />
          <h3 className="text-title !text-[1rem]">{eventTitle}</h3>
          {pending.length > 0 && <span className="badge-warm-sand rounded-full px-2 py-0.5 text-xs font-semibold">{pending.length} pendente(s)</span>}
        </div>
      </div>
      <div className="space-y-2">
        {pending.map((enrollment) => (
          <div
            key={enrollment.id}
            className="flex items-center justify-between rounded-lg border border-[hsl(var(--border)/0.5)] bg-[hsl(var(--warm-sand)/0.3)] p-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--warm-ocean-light))]">
                <Users weight="duotone" className="h-4 w-4 text-[hsl(var(--warm-ocean))]" />
              </div>
              <div>
                <p className="text-body-sm font-medium">Usuario #{enrollment.userId}</p>
                <p className="text-caption text-[hsl(var(--text-muted))]">
                  Inscrito em {new Date(enrollment.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <motion.button
                className="btn-warm-secondary h-8 w-8 !p-0 text-[hsl(var(--success))] hover:bg-[hsl(var(--success))/10] hover:border-[hsl(var(--success))/30]"
                onClick={() => updateStatus.mutate({ id: enrollment.id, status: "accepted" })}
                disabled={updateStatus.isPending}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <CheckCircle weight="duotone" className="h-4 w-4" />
              </motion.button>
              <motion.button
                className="btn-warm-secondary h-8 w-8 !p-0 text-[hsl(var(--warm-coral))] hover:bg-[hsl(var(--warm-coral))/10] hover:border-[hsl(var(--warm-coral))/30]"
                onClick={() => updateStatus.mutate({ id: enrollment.id, status: "rejected" })}
                disabled={updateStatus.isPending}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <XCircle weight="duotone" className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        ))}
        {accepted.length > 0 && (
          <>
            <div className="flex items-center gap-2 pt-2">
              <span className="text-caption font-semibold text-[hsl(var(--text-muted))]">Voluntarios aceitos</span>
              <div className="h-px flex-1 bg-[hsl(var(--border)/0.3)]" />
            </div>
            {accepted.map((enrollment) => (
              <div
                key={enrollment.id}
                className="flex items-center justify-between rounded-lg border border-[hsl(var(--border)/0.5)] bg-[hsl(var(--surface-subtle))] p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--success))/10]">
                    <CheckCircle weight="duotone" className="h-4 w-4 text-[hsl(var(--success))]" />
                  </div>
                  <div>
                    <p className="text-body-sm font-medium">Usuario #{enrollment.userId}</p>
                    <p className="text-caption text-[hsl(var(--text-muted))]">
                      Inscrito em {new Date(enrollment.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <motion.button
                  className="btn-warm-primary h-8 gap-1 !px-3 text-xs"
                  onClick={() => updateStatus.mutate({ id: enrollment.id, status: "present" })}
                  disabled={updateStatus.isPending}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <CheckCircle weight="duotone" className="h-3.5 w-3.5" />
                  Confirmar presenca
                </motion.button>
              </div>
            ))}
          </>
        )}
      </div>
    </motion.div>
  );
}

function EventPhotoManager({ eventId }: { eventId: number }) {
  const [open, setOpen] = useState(false);
  const [imageBase64, setImageBase64] = useState("");
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState("");
  const { data: images } = trpc.eventGallery.list.useQuery({ eventId }, { enabled: open });
  const utils = trpc.useUtils();
  const addImage = trpc.eventGallery.add.useMutation({
    onSuccess: () => {
      utils.eventGallery.list.invalidate({ eventId });
      setImageBase64("");
      setCaption("");
      setPreview("");
      toast.success("Imagem adicionada!");
    },
    onError: (err) => toast.error(err.message),
  });
  const removeImage = trpc.eventGallery.remove.useMutation({
    onSuccess: () => {
      utils.eventGallery.list.invalidate({ eventId });
      toast.success("Imagem removida");
    },
  });

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const maxWidth = 800;
            let { width, height } = img;
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) { reject(new Error("Canvas not supported")); return; }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.8));
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 20MB.");
      return;
    }
    try {
      const compressed = await compressImage(file);
      setImageBase64(compressed);
      setPreview(compressed);
    } catch {
      toast.error("Erro ao processar a imagem. Tente novamente.");
    }
  };

  const handleAdd = () => {
    if (!imageBase64) return;
    addImage.mutate({ eventId, imageBase64, caption });
  };

  return (
    <>
      <motion.button
        className="btn-warm-secondary h-8 w-8 !p-0 text-[hsl(var(--warm-ocean))] hover:bg-[hsl(var(--warm-ocean))/10] hover:border-[hsl(var(--warm-ocean))/30]"
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Images weight="duotone" className="h-4 w-4" />
      </motion.button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-title">Fotos do evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="img-file">Imagem do dispositivo</Label>
              <input
                id="img-file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="input-warm file:mr-3 file:rounded-md file:border-0 file:bg-[hsl(var(--warm-ocean))] file:px-3 file:py-1.5 file:text-sm file:text-white file:cursor-pointer file:hover:bg-[hsl(var(--warm-ocean-hover))]"
              />
            </div>
            {preview && (
              <div className="overflow-hidden rounded-lg border border-[hsl(var(--border)/0.5)]">
                <img src={preview} alt="Preview" className="h-40 w-full object-cover" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="img-caption">Legenda (opcional)</Label>
              <input id="img-caption" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Descreva a foto" className="input-warm" />
            </div>
            <motion.button className="btn-warm-primary w-full gap-2" onClick={handleAdd} disabled={addImage.isPending || !imageBase64} variants={buttonHover} whileHover="hover" whileTap="tap">
              <Plus weight="duotone" className="h-4 w-4" />
              Adicionar foto
            </motion.button>

            {images && images.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-[hsl(var(--border)/0.5)]">
                <h3 className="text-label">Fotos existentes</h3>
                <div className="grid grid-cols-2 gap-3">
                  {images.map((img) => (
                    <div key={img.id} className="group relative overflow-hidden rounded-lg">
                      <img src={img.imageUrl} alt={img.caption ?? ""} className="h-24 w-full object-cover" />
                      {img.caption && <p className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-xs text-white">{img.caption}</p>}
                      <motion.button
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-[hsl(var(--warm-coral))] text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage.mutate({ id: img.id })}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash weight="duotone" className="h-3 w-3" />
                      </motion.button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CreateEventForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (data: {
    categoryId: number;
    title: string;
    description: string;
    requirements: string;
    experienceLevel: "iniciante" | "intermediario" | "avancado" | "todos";
    eventDate: string;
    eventTime: string;
    duration: string;
    durationUnit: string;
    city: string;
    state: string;
    maxVolunteers: number;
    locationName: string;
    address: string;
  }) => void;
  isPending: boolean;
}) {
  const { data: categories, isLoading: catsLoading } = trpc.category.listWithSubcategories.useQuery();
  const [selectedParent, setSelectedParent] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [durationValue, setDurationValue] = useState<string>("");
  const [durationUnit, setDurationUnit] = useState<string>("horas");

  // Cria um mapa para busca rápida de categorias e subcategorias
  const categoryMap = useMemo(() => {
    const map = new Map<number, any>();
    categories?.forEach(cat => map.set(cat.id, cat));
    return map;
  }, [categories]);

  const selectedParentCat = categoryMap.get(Number(selectedParent));
  const subcategories = selectedParentCat?.subcategories ?? [];

  const finalCategoryId = selectedSubcategory ? parseInt(selectedSubcategory) : (selectedParent ? parseInt(selectedParent) : 0);

  return (
    <motion.form
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const data = new FormData(form);
        onSubmit({
          categoryId: finalCategoryId,
          title: data.get("title") as string,
          description: data.get("description") as string,
          requirements: data.get("requirements") as string,
          experienceLevel: data.get("experienceLevel") as "iniciante" | "intermediario" | "avancado" | "todos",
          eventDate: data.get("eventDate") as string,
          eventTime: data.get("eventTime") as string,
          duration: `${durationValue} ${durationUnit}`,
          durationUnit,
          city: data.get("city") as string,
          state: data.get("state") as string,
          maxVolunteers: parseInt(data.get("maxVolunteers") as string),
          locationName: data.get("locationName") as string,
          address: data.get("address") as string,
        });
      }}
      className="space-y-4"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <motion.div className="space-y-2" variants={fadeInUp} transition={{ delay: 0.1 }}>
        <Label htmlFor="title" className="text-label">Título</Label>
        <motion.input id="title" name="title" required placeholder="Nome do evento" className="input-warm" whileFocus={{ scale: 1.005, borderColor: "hsl(var(--warm-ocean))" }} transition={{ duration: 0.2 }} />
      </motion.div>

      <motion.div className="space-y-2" variants={fadeInUp} transition={{ delay: 0.15 }}>
        <Label htmlFor="description" className="text-label">Descrição</Label>
        <textarea id="description" name="description" required rows={3} placeholder="Descreva o evento" className="input-warm !py-2.5 !min-h-[60px]" />
      </motion.div>

      <motion.div className="space-y-2" variants={fadeInUp} transition={{ delay: 0.2 }}>
        <Label htmlFor="categoryId" className="text-label">Categoria</Label>
        <select id="categoryId-parent" value={selectedParent} onChange={(e) => { setSelectedParent(e.target.value); setSelectedSubcategory(""); }} required className="input-warm">
          <option value="">Selecione a categoria...</option>
          {catsLoading ? (
            <option value="">Carregando...</option>
          ) : (
            categories?.map((cat) => (
              <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
            ))
          )}
        </select>
        <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>
          Selecione uma categoria para ver subcategorias disponíveis
        </p>
      </motion.div>
      {subcategories.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="categoryId-sub" className="text-label">Subcategoria (opcional)</Label>
          <select id="categoryId-sub" value={selectedSubcategory} onChange={(e) => setSelectedSubcategory(e.target.value)} className="input-warm">
            <option value="">Usar categoria principal</option>
            {subcategories.map((sub) => (
              <option key={sub.id} value={sub.id.toString()}>↳ {sub.name}</option>
            ))}
          </select>
        </div>
      )}

      <motion.div className="space-y-2" variants={fadeInUp} transition={{ delay: 0.25 }}>
        <Label htmlFor="requirements" className="text-label">Requisitos</Label>
        <textarea id="requirements" name="requirements" rows={2} placeholder="Requisitos para participação (opcional)" className="input-warm !py-2.5 !min-h-[60px]" />
      </motion.div>

      <motion.div className="space-y-2" variants={fadeInUp} transition={{ delay: 0.3 }}>
        <Label htmlFor="experienceLevel" className="text-label">Nível de experiência</Label>
        <select id="experienceLevel" name="experienceLevel" className="input-warm">
          <option value="todos">Todos os níveis</option>
          <option value="iniciante">Iniciante</option>
          <option value="intermediario">Intermediário</option>
          <option value="avancado">Avançado</option>
        </select>
      </motion.div>

      <motion.div className="grid grid-cols-2 gap-4" variants={fadeInUp} transition={{ delay: 0.35 }}>
        <div className="space-y-2">
          <Label htmlFor="eventDate" className="text-label">Data</Label>
          <input id="eventDate" name="eventDate" type="date" required className="input-warm" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="eventTime" className="text-label">Horário</Label>
          <input id="eventTime" name="eventTime" type="time" className="input-warm" />
        </div>
      </motion.div>

      <motion.div className="grid grid-cols-2 gap-4" variants={fadeInUp} transition={{ delay: 0.4 }}>
        <div className="space-y-2">
          <Label htmlFor="duration" className="text-label">Duração estimada</Label>
          <input id="duration" name="duration" type="number" min="1" value={durationValue} onChange={(e) => setDurationValue(e.target.value)} required placeholder="Ex: 4" className="input-warm" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="durationUnit" className="text-label">Unidade</Label>
          <select id="durationUnit" value={durationUnit} onChange={(e) => setDurationUnit(e.target.value)} className="input-warm">
            <option value="minutos">Minutos</option>
            <option value="horas">Horas</option>
            <option value="dias">Dias</option>
          </select>
        </div>
      </motion.div>

      <motion.div className="space-y-2" variants={fadeInUp} transition={{ delay: 0.45 }}>
        <Label htmlFor="locationName" className="text-label">Local do evento</Label>
        <motion.input id="locationName" name="locationName" required placeholder="Nome do local" className="input-warm" whileFocus={{ scale: 1.005, borderColor: "hsl(var(--warm-ocean))" }} transition={{ duration: 0.2 }} />
      </motion.div>

      <motion.div className="space-y-2" variants={fadeInUp} transition={{ delay: 0.5 }}>
        <Label htmlFor="address" className="text-label">Endereço</Label>
        <motion.input id="address" name="address" placeholder="Endereço completo" className="input-warm" whileFocus={{ scale: 1.005, borderColor: "hsl(var(--warm-ocean))" }} transition={{ duration: 0.2 }} />
      </motion.div>

      <motion.div className="grid grid-cols-2 gap-4" variants={fadeInUp} transition={{ delay: 0.55 }}>
        <div className="space-y-2">
          <Label htmlFor="city" className="text-label">Cidade</Label>
          <input id="city" name="city" required placeholder="Cidade" className="input-warm" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state" className="text-label">Estado (UF)</Label>
          <select id="state" name="state" required className="input-warm">
            <option value="">Selecione</option>
            {BRAZIL_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </motion.div>

      <motion.div className="space-y-2" variants={fadeInUp} transition={{ delay: 0.6 }}>
        <Label htmlFor="maxVolunteers" className="text-label">Número de vagas</Label>
        <input id="maxVolunteers" name="maxVolunteers" type="number" min={1} required placeholder="Quantidade de voluntários" className="input-warm" />
      </motion.div>

      <motion.button
        type="submit"
        className="btn-warm-primary w-full"
        disabled={isPending}
        variants={buttonHover}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        transition={{ delay: 0.65 }}
      >
        {isPending ? "Criando..." : "Criar evento"}
      </motion.button>
    </motion.form>
  );
}
