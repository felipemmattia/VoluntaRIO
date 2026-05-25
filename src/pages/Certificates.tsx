import { useState, useRef } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Certificate, Calendar, Clock, CheckCircle, DownloadSimple, FileText, FileImage, FilePdf } from "@phosphor-icons/react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { fadeInUp, fadeInDown, staggerContainer, buttonHover, scaleIn } from "@/lib/motion-variants";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function CertificatePreview({ cert, onClose }: { cert: { volunteerName: string; eventTitle: string; eventDate: string; eventLocation: string; ongName: string; hoursContributed: number; verificationCode: string; issuedAt: string }; onClose: () => void }) {
  const previewRef = useRef<HTMLDivElement>(null);

  const exportAs = async (format: "pdf" | "jpg") => {
    if (!previewRef.current) return;
    const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true });
    if (format === "jpg") {
      const link = document.createElement("a");
      link.download = `certificado-${cert.verificationCode}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.92);
      link.click();
    } else {
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
      pdf.save(`certificado-${cert.verificationCode}.pdf`);
    }
    toast.success(`Certificado baixado como ${format.toUpperCase()}`);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={previewRef}
          className="relative w-[800px] max-w-full overflow-hidden rounded-2xl"
          style={{
            background: "linear-gradient(135deg, hsl(var(--warm-ocean)) 0%, #0a3d5c 50%, #062233 100%)",
            padding: "48px 56px",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {/* decorative lines */}
          <div className="absolute left-0 top-0 h-2 w-full" style={{ background: "linear-gradient(90deg, hsl(var(--warm-coral)), hsl(var(--warm-gold)), hsl(var(--warm-seafoam)))" }} />
          <div className="absolute bottom-0 left-0 h-2 w-full" style={{ background: "linear-gradient(90deg, hsl(var(--warm-seafoam)), hsl(var(--warm-gold)), hsl(var(--warm-coral)))" }} />

          <div className="relative z-10 text-center text-white">
            <img src="/VoluntaRIO_Logo.png" alt="VoluntaRIO" className="mx-auto mb-6 h-8 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
            <div className="mx-auto mb-6 h-px w-24" style={{ backgroundColor: "hsl(var(--warm-coral) / 0.6)" }} />
            <h2 className="mb-2 text-2xl font-bold tracking-wide">CERTIFICADO DE PARTICIPAÇÃO</h2>
            <p className="mb-8 text-sm opacity-80">Plataforma de Voluntariado Marinho</p>

            <p className="mb-2 text-sm opacity-70">Certificamos que</p>
            <p className="mb-6 text-2xl font-bold">{cert.volunteerName}</p>
            <p className="mb-2 text-sm opacity-70">participou do evento</p>
            <p className="mb-2 text-xl font-semibold">{cert.eventTitle}</p>
            <p className="mb-6 text-sm opacity-80">{cert.eventDate} &mdash; {cert.eventLocation}</p>

            <div className="mx-auto mb-6 flex items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold">{cert.hoursContributed}h</p>
                <p className="text-xs opacity-70">Horas contribuídas</p>
              </div>
              <div className="h-10 w-px opacity-30" style={{ backgroundColor: "white" }} />
              <div className="text-center">
                <p className="text-2xl font-bold">{cert.ongName}</p>
                <p className="text-xs opacity-70">ONG organizadora</p>
              </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }} className="mx-auto mb-6 w-64" />

            <div className="text-center">
              <p className="text-xs opacity-50 mb-1">Código de verificação: {cert.verificationCode}</p>
              <p className="text-xs opacity-50">Emitido em {new Date(cert.issuedAt).toLocaleDateString("pt-BR")}</p>
            </div>

            <div className="absolute bottom-12 right-12 opacity-10">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <motion.button
            className="btn-warm-primary gap-2"
            onClick={() => exportAs("pdf")}
            variants={buttonHover}
            initial="rest"
            whileHover="hover"
            whileTap="tap"
          >
            <FilePdf weight="duotone" className="h-4 w-4" />
            Baixar PDF
          </motion.button>
          <motion.button
            className="btn-warm-secondary gap-2"
            onClick={() => exportAs("jpg")}
            variants={buttonHover}
            initial="rest"
            whileHover="hover"
            whileTap="tap"
          >
            <FileImage weight="duotone" className="h-4 w-4" />
            Baixar JPG
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Certificates() {
  const { isAuthenticated } = useAuth();
  const [justGenerated, setJustGenerated] = useState<number | null>(null);
  const [previewCert, setPreviewCert] = useState<{ volunteerName: string; eventTitle: string; eventDate: string; eventLocation: string; ongName: string; hoursContributed: number; verificationCode: string; issuedAt: string } | null>(null);

  const { data: certificates, isLoading: certsLoading } = trpc.certificate.myCertificates.useQuery(undefined, { enabled: isAuthenticated });
  const { data: enrollments } = trpc.enrollment.myEnrollments.useQuery(undefined, { enabled: isAuthenticated });
  const { data: stats } = trpc.certificate.getStats.useQuery(undefined, { enabled: isAuthenticated });

  const generateCert = trpc.certificate.generate.useMutation({
    onSuccess: (data, variables) => {
      if (data.alreadyExists) {
        toast.info("Certificado ja foi gerado para este evento");
      } else {
        toast.success("Certificado gerado com sucesso! Seu impacto esta registrado.");
        setJustGenerated(variables.eventId);
        setTimeout(() => setJustGenerated(null), 2000);
      }
      utils.certificate.myCertificates.invalidate();
      utils.certificate.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao gerar certificado");
    },
  });

  const utils = trpc.useUtils();

  const eligibleEvents = enrollments?.filter(
    (e) => e.status === "present" && e.eventDate && new Date(e.eventDate) <= new Date()
  ) ?? [];

  const certEventIds = new Set(certificates?.map((c) => c.eventId) ?? []);
  const eventsWithoutCert = eligibleEvents.filter((e) => !certEventIds.has(e.eventId));

  const handleGenerate = (eventId: number) => {
    generateCert.mutate({ eventId });
  };

  const handlePreview = async (cert: any) => {
    const event = enrollments?.find((e) => e.eventId === cert.eventId);
    setPreviewCert({
      volunteerName: "Voluntario",
      eventTitle: cert.eventTitle,
      eventDate: cert.eventDate ? new Date(cert.eventDate).toLocaleDateString("pt-BR") : "N/A",
      eventLocation: event?.eventLocation ?? "",
      ongName: event?.ongName ?? "",
      hoursContributed: Number(cert.hoursContributed ?? 0),
      verificationCode: cert.verificationCode,
      issuedAt: new Date(cert.issuedAt).toISOString(),
    });
  };

  return (
    <motion.div
      className="container-warm section-warm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {previewCert && <CertificatePreview cert={previewCert} onClose={() => setPreviewCert(null)} />}

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div className="mb-10 space-y-3" variants={fadeInUp}>
          <Link to="/dashboard" className="btn-warm-ghost -ml-2 gap-2">
            <ArrowLeft weight="duotone" className="h-4 w-4" />
            Voltar ao painel
          </Link>
          <h1 className="text-headline">Certificados</h1>
          <p className="text-body-sm text-[hsl(var(--text-muted))] text-pretty">
            Gere e baixe seus certificados de participacao em eventos. A ONG precisa confirmar sua presenca para liberar o certificado.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {[
            { label: "Certificados", value: stats?.totalCertificates ?? 0, icon: Certificate, color: "text-[hsl(var(--warm-coral))]" },
            { label: "Eventos", value: stats?.totalEventsParticipated ?? 0, icon: Calendar, color: "text-[hsl(var(--info))]" },
            { label: "Horas", value: stats?.totalHoursContributed ?? 0, icon: Clock, color: "text-[hsl(var(--success))]" },
            { label: "Proximos", value: stats?.upcomingEvents ?? 0, icon: CheckCircle, color: "text-[hsl(var(--warm-ocean))]" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="card-warm-subtle"
              variants={fadeInUp}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  <stat.icon className={`h-7 w-7 ${stat.color}`} />
                </motion.div>
                <div>
                  <p className="text-metric text-[clamp(1.5rem,3vw,2rem)]">{stat.value}</p>
                  <p className="text-caption">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Certificates */}
          <motion.div className="card-warm" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={fadeInUp}>
            <div className="mb-4 flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.2, rotate: 10 }} transition={{ duration: 0.3 }}>
                <Certificate weight="duotone" className="h-5 w-5 text-[hsl(var(--warm-coral))]" />
              </motion.div>
              <h2 className="text-title">Meus certificados</h2>
            </div>
            <div className="divider-warm mb-4" />
            {certsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
              </div>
            ) : certificates && certificates.length > 0 ? (
              <motion.div className="space-y-3" variants={staggerContainer}>
                {certificates.map((cert, i) => (
                  <motion.div
                    key={cert.id}
                    className={`flex items-center justify-between rounded-2xl border p-4 transition-all duration-500 ${
                      justGenerated === cert.eventId
                        ? "border-[hsl(var(--warm-ocean))/0.3] bg-[hsl(var(--warm-ocean-light))]"
                        : "border-[hsl(var(--border)/0.5)] bg-[hsl(var(--surface-subtle))]"
                    }`}
                    variants={fadeInUp}
                    custom={i}
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-body-sm font-semibold truncate">{cert.eventTitle}</p>
                      <div className="mt-1.5 flex items-center gap-3 text-caption">
                        <span className="flex items-center gap-1">
                          <Calendar weight="duotone" className="h-3.5 w-3.5" />
                          {cert.eventDate ? new Date(cert.eventDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "N/A"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock weight="duotone" className="h-3.5 w-3.5" />
                          {cert.hoursContributed ?? 0}h
                        </span>
                      </div>
                      <p className="mt-1.5 text-caption">
                        Codigo: {cert.verificationCode}
                      </p>
                    </div>
                    <motion.button
                      className="btn-warm-primary ml-4 gap-1.5"
                      onClick={() => handlePreview(cert)}
                      variants={buttonHover}
                      initial="rest"
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <DownloadSimple weight="duotone" className="h-4 w-4" />
                      Exportar
                    </motion.button>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                className="py-12 text-center"
                initial="hidden"
                animate="visible"
                variants={scaleIn}
              >
                <motion.div variants={fadeInUp}>
                  <Certificate weight="duotone" className="mx-auto mb-4 h-10 w-10 text-[hsl(var(--text-muted))]" />
                </motion.div>
                <motion.p className="text-body-sm font-medium" variants={fadeInUp}>Nenhum certificado gerado ainda</motion.p>
                <motion.p className="mt-1 text-caption text-pretty" variants={fadeInUp}>
                  Participe de eventos e a ONG confirme sua presenca para liberar o certificado.
                </motion.p>
              </motion.div>
            )}
          </motion.div>

          {/* Generate New */}
          <motion.div className="card-warm" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={fadeInUp}>
            <div className="mb-4 flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.2, rotate: 10 }} transition={{ duration: 0.3 }}>
                <FileText weight="duotone" className="h-5 w-5 text-[hsl(var(--text-muted))]" />
              </motion.div>
              <h2 className="text-title">Gerar novo certificado</h2>
            </div>
            <div className="divider-warm mb-4" />
            <p className="mb-5 text-body-sm text-[hsl(var(--text-muted))]">
              Eventos com presenca confirmada pela ONG que ainda nao possuem certificado.
            </p>
            {eventsWithoutCert.length > 0 ? (
              <motion.div className="space-y-3" variants={staggerContainer}>
                {eventsWithoutCert.map((e, i) => (
                  <motion.div
                    key={e.id}
                    className="flex items-center justify-between rounded-2xl border border-[hsl(var(--border)/0.5)] bg-[hsl(var(--surface-subtle))] p-4"
                    variants={fadeInUp}
                    custom={i}
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-body-sm font-semibold truncate">{e.eventTitle}</p>
                      <div className="mt-1.5 flex items-center gap-3 text-caption">
                        <span className="flex items-center gap-1">
                          <Calendar weight="duotone" className="h-3.5 w-3.5" />
                          {e.eventDate ? new Date(e.eventDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "N/A"}
                        </span>
                        <span>{e.eventLocation}</span>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => handleGenerate(e.eventId)}
                      disabled={generateCert.isPending}
                      className={`btn-warm-primary ml-4 gap-1.5 ${
                        justGenerated === e.eventId ? "bg-[hsl(var(--success))]" : ""
                      }`}
                      variants={buttonHover}
                      initial="rest"
                      whileHover="hover"
                      whileTap="tap"
                    >
                      {justGenerated === e.eventId ? (
                        <CheckCircle weight="duotone" className="h-4 w-4" />
                      ) : (
                        <Certificate weight="duotone" className="h-4 w-4" />
                      )}
                      {justGenerated === e.eventId ? "Gerado" : "Gerar"}
                    </motion.button>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                className="py-12 text-center"
                initial="hidden"
                animate="visible"
                variants={scaleIn}
              >
                <motion.div variants={fadeInUp}>
                  <CheckCircle weight="duotone" className="mx-auto mb-4 h-10 w-10 text-[hsl(var(--success))]" />
                </motion.div>
                <motion.p className="text-body-sm font-medium" variants={fadeInUp}>Tudo em dia</motion.p>
                <motion.p className="mt-1 text-caption text-pretty" variants={fadeInUp}>
                  Todos os eventos com presenca confirmada ja possuem certificado. Continue participando.
                </motion.p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
