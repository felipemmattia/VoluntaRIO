// Página de Doações: permite voluntários contribuírem financeiramente com ONGs ativas parceiras do projeto Plataforma VoluntaRIO.
import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Users, Calendar, CurrencyDollar, ArrowLeft } from "@phosphor-icons/react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { fadeInUp, fadeInDown, staggerContainer, buttonHover, scaleIn } from "@/lib/motion-variants";

export default function Donations() {
  const { isAuthenticated } = useAuth();
  const [selectedOng, setSelectedOng] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  const { data: ongs, isLoading: ongsLoading } = trpc.ong.listActive.useQuery();
  const { data: myDonations } = trpc.donation.myDonations.useQuery(undefined, { enabled: isAuthenticated });

  const createDonation = trpc.donation.create.useMutation({
    onSuccess: () => {
      toast.success("Doação realizada! Cada contribuição fortalece a preservação dos oceanos.");
      setAmount("");
      setMessage("");
      setAnonymous(false);
      utils.donation.myDonations.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao realizar doação");
    },
  });

  const utils = trpc.useUtils();

  // Manipula e valida o envio de uma doação financeira para a ONG selecionada
  const handleDonate = () => {
    if (!selectedOng) {
      toast.error("Selecione uma ONG");
      return;
    }
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum < 1) {
      toast.error("Valor minimo de R$ 1,00");
      return;
    }
    createDonation.mutate({
      ongId: selectedOng,
      amount: amountNum,
      message: message || undefined,
      anonymous,
    });
  };

  const totalDonated = myDonations?.reduce((sum, d) => sum + parseFloat(d.amount), 0) ?? 0;

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
        <motion.div className="mb-10 space-y-3" variants={fadeInUp}>
          <Link to="/dashboard" className="btn-warm-ghost -ml-2 gap-2">
            <ArrowLeft weight="duotone" className="h-4 w-4" />
            Voltar ao painel
          </Link>
          <h1 className="text-headline">Doações</h1>
          <p className="text-body-sm text-[hsl(var(--text-muted))] text-pretty">
            Contribua financeiramente com as ONGs que protegem nossos oceanos.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <motion.div className="card-warm" variants={fadeInUp}>
              <div className="mb-6 flex items-center gap-2">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Heart weight="duotone" className="h-5 w-5 text-[hsl(var(--warm-coral))]" />
                </motion.div>
                <h2 className="text-title">Fazer uma doação</h2>
              </div>
              <div className="divider-warm mb-6" />
              <p className="mb-6 text-body-sm text-[hsl(var(--text-muted))]">
                Escolha uma ONG e o valor da sua contribuição.
              </p>
              <div className="space-y-5">
                <div className="space-y-2">
                  <span className="text-label">Selecione a ONG</span>
                  <motion.div
                    className="grid gap-3 sm:grid-cols-2"
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                  >
                    {ongsLoading ? (
                      [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)
                    ) : (
                      ongs?.map((ong) => (
                        <motion.button
                          key={ong.id}
                          type="button"
                          onClick={() => setSelectedOng(ong.id)}
                          className={`group rounded-2xl border p-4 text-left transition-all duration-200 ${
                            selectedOng === ong.id
                              ? "border-[hsl(var(--warm-ocean))] bg-[hsl(var(--warm-ocean-light))] ring-2 ring-[hsl(var(--warm-ocean))/0.2]"
                              : "border-[hsl(var(--border)/0.5)] hover:border-[hsl(var(--warm-ocean)/0.3)] hover:shadow-soft"
                          }`}
                          variants={fadeInUp}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ duration: 0.2 }}
                        >
                          <p className="text-body-sm font-semibold transition-colors group-hover:text-[hsl(var(--warm-ocean))]">{ong.displayName}</p>
                          <p className="text-caption mt-0.5 line-clamp-1">{ong.mission}</p>
                        </motion.button>
                      ))
                    )}
                  </motion.div>
                </div>

                <motion.div className="space-y-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Label htmlFor="amount" className="text-label">Valor (R$)</Label>
                  <motion.input
                    id="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="50.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input-warm"
                    whileFocus={{ scale: 1.005, borderColor: "hsl(var(--warm-ocean))" }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.div>

                <motion.div className="space-y-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                  <Label htmlFor="message" className="text-label">Mensagem (opcional)</Label>
                  <motion.textarea
                    id="message"
                    placeholder="Deixe uma mensagem de apoio..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={500}
                    className="input-warm min-h-[80px] resize-none"
                    whileFocus={{ scale: 1.005, borderColor: "hsl(var(--warm-ocean))" }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.div>

                <motion.div className="flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                  <Switch
                    id="anonymous"
                    checked={anonymous}
                    onCheckedChange={setAnonymous}
                  />
                  <Label htmlFor="anonymous" className="text-body-sm font-normal">Doação anônima</Label>
                </motion.div>

                <motion.button
                  onClick={handleDonate}
                  className="btn-warm-primary w-full gap-2"
                  disabled={createDonation.isPending || !selectedOng || !amount}
                  variants={buttonHover}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                  transition={{ delay: 0.45 }}
                >
                  <Heart weight="duotone" className="h-5 w-5" />
                  {createDonation.isPending ? "Processando..." : "Doar agora"}
                </motion.button>
              </div>
            </motion.div>
          </div>

          <div className="space-y-6">
            {/* Coluna lateral que exibe o histórico de doações efetuadas e simulação de impacto financeiro */}
            <motion.div className="card-warm" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={fadeInUp}>
              <h2 className="text-title mb-4">Suas doações</h2>
              <div className="divider-warm mb-4" />
              <motion.div className="mb-5 text-center" variants={scaleIn}>
                <p className="text-metric">
                  R$ {totalDonated.toFixed(2)}
                </p>
                <p className="text-caption mt-1">Total doado</p>
              </motion.div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {myDonations && myDonations.length > 0 ? (
                  myDonations.slice(0, 10).map((d, i) => (
                    <motion.div
                      key={d.id}
                      className="flex items-center justify-between rounded-xl bg-[hsl(var(--surface-subtle))] p-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ x: 4 }}
                    >
                      <div>
                        <p className="text-body-sm font-semibold">R$ {parseFloat(d.amount).toFixed(2)}</p>
                        <p className="text-caption">
                          {new Date(d.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        </p>
                      </div>
                      <motion.span className={`badge-warm ${d.status === "completed" ? "badge-warm" : "badge-warm-sand"}`} whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                        {d.status === "completed" ? "Concluída" : d.status === "pending" ? "Pendente" : d.status === "cancelled" ? "Cancelada" : d.status}
                      </motion.span>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    className="py-8 text-center"
                    initial="hidden"
                    animate="visible"
                    variants={scaleIn}
                  >
                    <motion.div variants={fadeInUp}>
                      <Heart weight="duotone" className="mx-auto mb-3 h-8 w-8 text-[hsl(var(--text-muted))]" />
                    </motion.div>
                    <motion.p className="text-body-sm font-medium" variants={fadeInUp}>Nenhuma doação ainda</motion.p>
                    <motion.p className="mt-1 text-caption text-pretty" variants={fadeInUp}>
                      Cada contribuição, por menor que seja, ajuda a preservar nossos oceanos.
                    </motion.p>
                  </motion.div>
                )}
              </div>
            </motion.div>

            <motion.div className="card-warm-subtle" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={fadeInUp}>
              <h2 className="text-title mb-4">Impacto da sua doação</h2>
              <div className="divider-warm mb-4" />
              <motion.div className="space-y-4" variants={staggerContainer}>
                {[
                  { icon: CurrencyDollar, label: "R$ 50", desc: "Material de limpeza para 1 praia" },
                  { icon: Users, label: "R$ 100", desc: "Almoço para 5 voluntários" },
                  { icon: Calendar, label: "R$ 200", desc: "Transporte para 1 expedição" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    className="flex items-start gap-3"
                    variants={fadeInUp}
                    custom={i}
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--warm-ocean))]" />
                    </motion.div>
                    <div>
                      <p className="text-body-sm font-semibold">{item.label}</p>
                      <p className="text-caption">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
