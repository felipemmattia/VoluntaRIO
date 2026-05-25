import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users,
  BuildingOffice,
  Calendar,
  Shield,
  ChartBar,
  UserCheck,
  Warning,
  CheckCircle,
  Pencil,
  Trash,
  Plus,
  X,
  FloppyDisk,
  ImageSquare,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { fadeInUp, fadeInDown, staggerContainer, cardHover, buttonHover } from "@/lib/motion-variants";

type UserRow = { id: number; name: string | null; email: string | null; role: string; createdAt: Date };
type OngRow = { id: number; displayName: string; city: string | null; state: string | null; status: string; autoAccept: boolean | null; description: string | null };
type EventRow = { id: number; title: string; eventDate: Date; city: string | null; state: string | null; status: string; maxVolunteers: number | null; description: string | null; location: string | null; startTime: string | null; endTime: string | null; categoryId: number | null };
type CategoryRow = { id: number; name: string; description: string | null; color: string | null; parentId: number | null };

const BRAZIL_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export default function AdminDashboard() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      navigate("/");
    }
  }, [isAuthenticated, isAdmin, isLoading, navigate]);

  const { data: stats } = trpc.admin.stats.useQuery(undefined, { enabled: isAdmin });
  const { data: users } = trpc.admin.listUsers.useQuery(undefined, { enabled: isAdmin });
  const { data: ongs } = trpc.admin.listOngs.useQuery(undefined, { enabled: isAdmin });
  const { data: allEvents } = trpc.admin.listEvents.useQuery(undefined, { enabled: isAdmin });
  const { data: categories } = trpc.category.list.useQuery();

  const utils = trpc.useUtils();

  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => { utils.admin.listUsers.invalidate(); toast.success("Papel atualizado"); },
  });
  const deleteUser = trpc.admin.deleteUser.useMutation({
    onSuccess: () => { utils.admin.listUsers.invalidate(); toast.success("Usuário excluído"); },
  });
  const updateOng = trpc.ong.updateStatus.useMutation({
    onSuccess: () => { utils.admin.listOngs.invalidate(); toast.success("ONG atualizada"); },
  });
  const updateOngFull = trpc.admin.updateOng.useMutation({
    onSuccess: () => { utils.admin.listOngs.invalidate(); toast.success("ONG atualizada"); },
  });
  const deleteOng = trpc.admin.deleteOng.useMutation({
    onSuccess: () => { utils.admin.listOngs.invalidate(); toast.success("ONG excluída"); },
  });
  const updateEvent = trpc.admin.updateEvent.useMutation({
    onSuccess: () => { utils.admin.listEvents.invalidate(); toast.success("Evento atualizado"); },
  });
  const deleteEvent = trpc.admin.deleteEvent.useMutation({
    onSuccess: () => { utils.admin.listEvents.invalidate(); toast.success("Evento excluído"); },
  });
  const createCategory = trpc.admin.createCategory.useMutation({
    onSuccess: () => { utils.category.list.invalidate(); toast.success("Categoria criada"); },
  });
  const updateCategory = trpc.admin.updateCategory.useMutation({
    onSuccess: () => { utils.category.list.invalidate(); toast.success("Categoria atualizada"); },
  });
  const deleteCategory = trpc.admin.deleteCategory.useMutation({
    onSuccess: () => { utils.category.list.invalidate(); toast.success("Categoria excluída"); },
  });

  const createUserMutation = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      utils.admin.listUsers.invalidate();
      setCreateUserOpen(false);
      setCreateUserData({ name: "", email: "", password: "", role: "user" });
      toast.success("Usuário criado com sucesso!");
    },
    onError: (err) => toast.error(err.message),
  });

  const clearEventPhotosMutation = trpc.admin.clearEventPhotos.useMutation({
    onSuccess: () => { toast.success("Fotos removidas"); },
  });

  const clearUserAvatarMutation = trpc.admin.clearUserAvatar.useMutation({
    onSuccess: () => {
      utils.admin.listUsers.invalidate();
      toast.success("Avatar removido");
    },
  });

  // --- Modal de edição de Usuário ---
  const [userEdit, setUserEdit] = useState<UserRow | null>(null);
  const [userEditRole, setUserEditRole] = useState("");

  // --- Modal de edição de ONG ---
  const [ongEdit, setOngEdit] = useState<OngRow | null>(null);
  const [ongEditData, setOngEditData] = useState({ displayName: "", city: "", state: "", description: "", status: "", autoAccept: false });

  // --- Modal de edição de Evento ---
  const [eventEdit, setEventEdit] = useState<EventRow | null>(null);
  const [eventEditData, setEventEditData] = useState({ title: "", description: "", city: "", state: "", status: "", maxVolunteers: 0, eventDate: "", startTime: "", endTime: "", location: "" });

  // --- Modal de criação/edição de Categoria ---
  const [catModal, setCatModal] = useState<{ open: boolean; mode: "create" | "edit"; cat: CategoryRow | null }>({ open: false, mode: "create", cat: null });
  const [catData, setCatData] = useState({ name: "", description: "", color: "#3b82f6", parentId: "" });

  // --- Modal de criação de Usuário ---
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createUserData, setCreateUserData] = useState({ name: "", email: "", password: "", role: "user" });

  // --- Confirmação de exclusão ---
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: string; id: number; name: string }>({ open: false, type: "", id: 0, name: "" });

  if (isLoading) return null;
  if (!isAdmin) return null;

  const roleLabel = (role: string) => {
    if (role === "admin") return "Administrador";
    if (role === "ong_manager") return "Gerente ONG";
    if (role === "user") return "Voluntário";
    return role;
  };

  const roleBadge = (role: string) => {
    if (role === "admin") return "badge-warm";
    if (role === "ong_manager") return "badge-warm-sand";
    return "badge-warm-sand";
  };

  const statusBadge = (status: string) => {
    if (status === "active") return "badge-warm";
    if (status === "pending") return "badge-warm-sand";
    if (status === "suspended") return "badge-warm-coral";
    if (status === "completed") return "badge-warm";
    if (status === "cancelled") return "badge-warm-coral";
    return "badge-warm-sand";
  };

  const translateStatus = (status: string) => {
    const map: Record<string, string> = {
      active: "Ativo",
      pending: "Pendente",
      suspended: "Suspenso",
      completed: "Concluído",
      cancelled: "Cancelado",
      draft: "Rascunho",
    };
    return map[status] ?? status;
  };

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
        <motion.div className="mb-8 flex items-center gap-3" variants={fadeInUp}>
          <Shield weight="duotone" className="h-8 w-8 text-[hsl(var(--warm-ocean))]" />
          <div>
            <h1 className="text-headline">Painel administrativo</h1>
            <p className="text-body-sm text-[hsl(var(--text-muted))]">Gerenciamento completo da plataforma VoluntaRIO</p>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {[
            { label: "Usuários", value: stats?.totalUsers ?? 0, icon: Users },
            { label: "ONGs", value: stats?.totalOngs ?? 0, icon: BuildingOffice },
            { label: "Eventos ativos", value: stats?.activeEvents ?? 0, icon: Calendar },
            { label: "Inscrições", value: stats?.totalEnrollments ?? 0, icon: ChartBar },
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
                  <p className="text-metric !text-[28px]">{stat.value}</p>
                  <p className="text-caption">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {[
            { label: "Voluntários", value: stats?.totalVolunteers ?? 0, icon: UserCheck },
            { label: "Gerentes ONG", value: stats?.totalOngManagers ?? 0, icon: BuildingOffice },
            { label: "Admins", value: stats?.totalAdmins ?? 0, icon: Shield },
            { label: "Eventos concluídos", value: stats?.completedEvents ?? 0, icon: CheckCircle },
            { label: "ONGs pendentes", value: stats?.pendingOngs ?? 0, icon: Warning },
            { label: "ONGs suspensas", value: stats?.suspendedOngs ?? 0, icon: Warning },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              className="card-warm-subtle !p-3"
              variants={fadeInUp}
              whileHover={{ y: -2, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2">
                <stat.icon className="h-5 w-5 text-[hsl(var(--text-muted))]" />
                <div>
                  <p className="text-body font-semibold">{stat.value}</p>
                  <p className="text-caption">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <Tabs defaultValue="users">
          <TabsList className="mb-6 rounded-xl">
            <TabsTrigger value="users" className="rounded-lg">Usuários</TabsTrigger>
            <TabsTrigger value="ongs" className="rounded-lg">ONGs</TabsTrigger>
            <TabsTrigger value="events" className="rounded-lg">Eventos</TabsTrigger>
            <TabsTrigger value="categories" className="rounded-lg">Categorias</TabsTrigger>
          </TabsList>

          {/* USERS TAB */}
          <TabsContent value="users">
            <motion.div
              className="card-warm-subtle !p-0 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center justify-between p-4">
                <h3 className="text-body font-semibold">Usuários</h3>
                <motion.button type="button" onClick={() => setCreateUserOpen(true)} className="btn-warm-primary !px-3 !py-1.5 text-sm" variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap">
                  <Plus weight="duotone" className="mr-1 h-4 w-4" /> Criar Conta
                </motion.button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Criado</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-mono text-caption">{u.id}</TableCell>
                        <TableCell className="font-medium">{u.name ?? "-"}</TableCell>
                        <TableCell className="text-body-sm">{u.email ?? "-"}</TableCell>
                        <TableCell>
                          <span className={roleBadge(u.role)}>{roleLabel(u.role)}</span>
                        </TableCell>
                        <TableCell className="text-body-sm">
                          {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <motion.button type="button" onClick={() => { setUserEdit(u); setUserEditRole(u.role); }} className="btn-warm-secondary !px-2 !py-1 text-xs" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.2 }}>
                              <Pencil weight="duotone" className="h-3.5 w-3.5" />
                            </motion.button>
                            <motion.button type="button" onClick={() => clearUserAvatarMutation.mutate({ userId: u.id })} className="btn-warm-secondary !px-2 !py-1 text-xs" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.2 }}>
                              <ImageSquare weight="duotone" className="h-3.5 w-3.5" />
                            </motion.button>
                            <motion.button type="button" onClick={() => setDeleteConfirm({ open: true, type: "user", id: u.id, name: u.name ?? u.email ?? String(u.id) })} className="btn-warm-coral !px-2 !py-1 text-xs" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.2 }}>
                              <Trash weight="duotone" className="h-3.5 w-3.5" />
                            </motion.button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          </TabsContent>

          {/* ONGS TAB */}
          <TabsContent value="ongs">
            <motion.div
              className="card-warm-subtle !p-0 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aceitação</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ongs?.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-caption">{o.id}</TableCell>
                        <TableCell className="font-medium">{o.displayName}</TableCell>
                        <TableCell className="text-body-sm">{o.city}, {o.state}</TableCell>
                        <TableCell>
                          <span className={statusBadge(o.status)}>{translateStatus(o.status)}</span>
                        </TableCell>
                        <TableCell className="text-body-sm">{o.autoAccept ? "Automática" : "Manual"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <motion.button type="button" onClick={() => { setOngEdit(o); setOngEditData({ displayName: o.displayName, city: o.city ?? "", state: o.state ?? "", description: o.description ?? "", status: o.status, autoAccept: o.autoAccept ?? false }); }} className="btn-warm-secondary !px-2 !py-1 text-xs" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.2 }}>
                              <Pencil weight="duotone" className="h-3.5 w-3.5" />
                            </motion.button>
                            <motion.button type="button" onClick={() => setDeleteConfirm({ open: true, type: "ong", id: o.id, name: o.displayName })} className="btn-warm-coral !px-2 !py-1 text-xs" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.2 }}>
                              <Trash weight="duotone" className="h-3.5 w-3.5" />
                            </motion.button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          </TabsContent>

          {/* EVENTS TAB */}
          <TabsContent value="events">
            <motion.div
              className="card-warm-subtle !p-0 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Vagas</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allEvents?.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-mono text-caption">{e.id}</TableCell>
                        <TableCell className="font-medium">{e.title}</TableCell>
                        <TableCell className="text-body-sm">{new Date(e.eventDate).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell className="text-body-sm">{e.city}, {e.state}</TableCell>
                        <TableCell>
                          <span className={statusBadge(e.status)}>{translateStatus(e.status)}</span>
                        </TableCell>
                        <TableCell className="text-body-sm">{e.maxVolunteers}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <motion.button type="button" onClick={() => { setEventEdit(e); setEventEditData({ title: e.title, description: (e as any).description ?? "", city: e.city ?? "", state: e.state ?? "", status: e.status, maxVolunteers: e.maxVolunteers ?? 0, eventDate: new Date(e.eventDate).toISOString().split("T")[0], startTime: (e as any).startTime ?? "", endTime: (e as any).endTime ?? "", location: (e as any).location ?? "" }); }} className="btn-warm-secondary !px-2 !py-1 text-xs" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.2 }}>
                              <Pencil weight="duotone" className="h-3.5 w-3.5" />
                            </motion.button>
                            <motion.button type="button" onClick={() => clearEventPhotosMutation.mutate({ eventId: e.id })} className="btn-warm-secondary !px-2 !py-1 text-xs" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.2 }}>
                              <ImageSquare weight="duotone" className="h-3.5 w-3.5" />
                            </motion.button>
                            <motion.button type="button" onClick={() => setDeleteConfirm({ open: true, type: "event", id: e.id, name: e.title })} className="btn-warm-coral !px-2 !py-1 text-xs" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.2 }}>
                              <Trash weight="duotone" className="h-3.5 w-3.5" />
                            </motion.button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          </TabsContent>

          {/* CATEGORIES TAB */}
          <TabsContent value="categories">
            <motion.div
              className="card-warm-subtle !p-0 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center justify-between p-4">
                <h3 className="text-body font-semibold">Categorias</h3>
                <motion.button type="button" onClick={() => { setCatModal({ open: true, mode: "create", cat: null }); setCatData({ name: "", description: "", color: "#3b82f6", parentId: "" }); }} className="btn-warm-primary !px-3 !py-1.5 text-sm" variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap">
                  <Plus weight="duotone" className="mr-1 h-4 w-4" /> Nova Categoria
                </motion.button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nome</TableHead>
                       <TableHead>Descrição</TableHead>
                      <TableHead>Pai</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories?.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-caption">{c.id}</TableCell>
                        <TableCell className="font-medium">
                          <span className="flex items-center gap-2">
                            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: c.color ?? "#ccc" }} />
                            {c.name}
                          </span>
                        </TableCell>
                        <TableCell className="text-body-sm">{c.description ?? "-"}</TableCell>
                        <TableCell className="text-body-sm">{c.parentId ? categories?.find(p => p.id === c.parentId)?.name ?? "—" : "Categoria pai"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <motion.button type="button" onClick={() => { setCatModal({ open: true, mode: "edit", cat: c }); setCatData({ name: c.name, description: c.description ?? "", color: c.color ?? "#3b82f6", parentId: c.parentId ? String(c.parentId) : "" }); }} className="btn-warm-secondary !px-2 !py-1 text-xs" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.2 }}>
                              <Pencil weight="duotone" className="h-3.5 w-3.5" />
                            </motion.button>
                            <motion.button type="button" onClick={() => setDeleteConfirm({ open: true, type: "category", id: c.id, name: c.name })} className="btn-warm-coral !px-2 !py-1 text-xs" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.2 }}>
                              <Trash weight="duotone" className="h-3.5 w-3.5" />
                            </motion.button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* --- USER EDIT MODAL --- */}
      <Dialog open={!!userEdit} onOpenChange={(v) => !v && setUserEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar papel do usuário</DialogTitle>
            <DialogDescription>Alterar permissão de "{userEdit?.name ?? userEdit?.email}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={userEditRole} onValueChange={setUserEditRole}>
              <SelectTrigger><SelectValue placeholder="Selecione um papel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Voluntário</SelectItem>
                <SelectItem value="ong_manager">Gerente ONG</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserEdit(null)}>Cancelar</Button>
            <Button onClick={() => { if (userEdit) { updateRole.mutate({ id: userEdit.id, role: userEditRole }); } setUserEdit(null); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- ONG EDIT MODAL --- */}
      <Dialog open={!!ongEdit} onOpenChange={(v) => !v && setOngEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar ONG</DialogTitle>
            <DialogDescription>Atualizar informações de "{ongEdit?.displayName}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ong-name">Nome</Label>
              <Input id="ong-name" placeholder="Nome da ONG" value={ongEditData.displayName} onChange={(e) => setOngEditData({ ...ongEditData, displayName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="ong-city">Cidade</Label>
                <Input id="ong-city" placeholder="Cidade" value={ongEditData.city} onChange={(e) => setOngEditData({ ...ongEditData, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ong-state">Estado (UF)</Label>
                <select id="ong-state" value={ongEditData.state} onChange={(e) => setOngEditData({ ...ongEditData, state: e.target.value })} className="input-warm">
                  <option value="">UF</option>
                  {BRAZIL_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ong-desc">Descrição</Label>
              <Textarea id="ong-desc" placeholder="Descrição" value={ongEditData.description} onChange={(e) => setOngEditData({ ...ongEditData, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ong-status">Status</Label>
              <Select value={ongEditData.status} onValueChange={(v) => setOngEditData({ ...ongEditData, status: v })}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="suspended">Suspensa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-body-sm">
              <input type="checkbox" checked={ongEditData.autoAccept} onChange={(e) => setOngEditData({ ...ongEditData, autoAccept: e.target.checked })} />
              Aceitação automática de voluntários
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOngEdit(null)}>Cancelar</Button>
            <Button onClick={() => { if (ongEdit) { updateOngFull.mutate({ id: ongEdit.id, ...ongEditData }); } setOngEdit(null); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- EVENT EDIT MODAL --- */}
      <Dialog open={!!eventEdit} onOpenChange={(v) => !v && setEventEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar evento</DialogTitle>
            <DialogDescription>Atualizar informações de "{eventEdit?.title}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
               <Label htmlFor="event-title">Título</Label>
               <Input id="event-title" placeholder="Título" value={eventEditData.title} onChange={(e) => setEventEditData({ ...eventEditData, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-desc">Descrição</Label>
              <Textarea id="event-desc" placeholder="Descrição" value={eventEditData.description} onChange={(e) => setEventEditData({ ...eventEditData, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="event-city">Cidade</Label>
                <Input id="event-city" placeholder="Cidade" value={eventEditData.city} onChange={(e) => setEventEditData({ ...eventEditData, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-state">Estado (UF)</Label>
                <select id="event-state" value={eventEditData.state} onChange={(e) => setEventEditData({ ...eventEditData, state: e.target.value })} className="input-warm">
                  <option value="">UF</option>
                  {BRAZIL_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-location">Localização</Label>
              <Input id="event-location" placeholder="Localização" value={eventEditData.location} onChange={(e) => setEventEditData({ ...eventEditData, location: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label htmlFor="event-date">Data</Label>
                <Input id="event-date" type="date" value={eventEditData.eventDate} onChange={(e) => setEventEditData({ ...eventEditData, eventDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-start">Hora inicio</Label>
                <Input id="event-start" type="time" value={eventEditData.startTime} onChange={(e) => setEventEditData({ ...eventEditData, startTime: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-end">Hora fim</Label>
                <Input id="event-end" type="time" value={eventEditData.endTime} onChange={(e) => setEventEditData({ ...eventEditData, endTime: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
               <Label htmlFor="event-max">Número de vagas</Label>
              <Input id="event-max" type="number" min={1} value={eventEditData.maxVolunteers} onChange={(e) => setEventEditData({ ...eventEditData, maxVolunteers: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-status">Status</Label>
              <Select value={eventEditData.status} onValueChange={(v) => setEventEditData({ ...eventEditData, status: v })}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventEdit(null)}>Cancelar</Button>
            <Button onClick={() => { if (eventEdit) { updateEvent.mutate({ id: eventEdit.id, ...eventEditData }); } setEventEdit(null); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- CATEGORY CREATE/EDIT MODAL --- */}
      <Dialog open={catModal.open} onOpenChange={(v) => !v && setCatModal({ open: false, mode: "create", cat: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{catModal.mode === "create" ? "Nova categoria" : "Editar categoria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nome</Label>
              <Input id="cat-name" placeholder="Nome da categoria" value={catData.name} onChange={(e) => setCatData({ ...catData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
               <Label htmlFor="cat-desc">Descrição</Label>
               <Textarea id="cat-desc" placeholder="Descrição da categoria" value={catData.description} onChange={(e) => setCatData({ ...catData, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-color">Cor</Label>
              <div className="flex items-center gap-3">
                <input id="cat-color" type="color" value={catData.color} onChange={(e) => setCatData({ ...catData, color: e.target.value })} className="h-8 w-8 rounded border" />
                <span className="text-body-sm text-[hsl(var(--text-muted))]">{catData.color}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-parent">Categoria pai</Label>
              <select id="cat-parent" value={catData.parentId} onChange={(e) => setCatData({ ...catData, parentId: e.target.value })} className="input-warm">
                <option value="">Sem categoria pai (categoria principal)</option>
                {categories?.filter(c => c.id !== catModal.cat?.id).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatModal({ open: false, mode: "create", cat: null })}>Cancelar</Button>
            <Button onClick={() => {
              if (catModal.mode === "create") createCategory.mutate({ ...catData, parentId: catData.parentId ? parseInt(catData.parentId) : null });
              else if (catModal.cat) updateCategory.mutate({ id: catModal.cat.id, ...catData, parentId: catData.parentId ? parseInt(catData.parentId) : null });
              setCatModal({ open: false, mode: "create", cat: null });
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- CREATE USER MODAL --- */}
      <Dialog open={createUserOpen} onOpenChange={(v) => { if (!v) { setCreateUserOpen(false); setCreateUserData({ name: "", email: "", password: "", role: "user" }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar conta manualmente</DialogTitle>
            <DialogDescription>Crie uma nova conta de usuário na plataforma.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-user-name">Nome</Label>
              <Input id="new-user-name" placeholder="Nome completo" value={createUserData.name} onChange={(e) => setCreateUserData({ ...createUserData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-email">Email</Label>
              <Input id="new-user-email" type="email" placeholder="email@exemplo.com" value={createUserData.email} onChange={(e) => setCreateUserData({ ...createUserData, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-password">Senha</Label>
              <Input id="new-user-password" type="password" placeholder="Mínimo 6 caracteres" value={createUserData.password} onChange={(e) => setCreateUserData({ ...createUserData, password: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-role">Papel</Label>
              <Select value={createUserData.role} onValueChange={(v) => setCreateUserData({ ...createUserData, role: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione um papel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Voluntário</SelectItem>
                  <SelectItem value="ong_manager">Gerente ONG</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateUserOpen(false); setCreateUserData({ name: "", email: "", password: "", role: "user" }); }}>Cancelar</Button>
            <Button onClick={() => createUserMutation.mutate(createUserData)} disabled={createUserMutation.isPending || !createUserData.name || !createUserData.email || !createUserData.password}>
              {createUserMutation.isPending ? "Criando..." : "Criar conta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DELETE CONFIRM MODAL --- */}
      <Dialog open={deleteConfirm.open} onOpenChange={(v) => !v && setDeleteConfirm({ ...deleteConfirm, open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir "{deleteConfirm.name}"? Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm({ ...deleteConfirm, open: false })}>Cancelar</Button>
            <Button variant="destructive" onClick={() => {
              if (deleteConfirm.type === "user") deleteUser.mutate({ id: deleteConfirm.id });
              else if (deleteConfirm.type === "ong") deleteOng.mutate({ id: deleteConfirm.id });
              else if (deleteConfirm.type === "event") deleteEvent.mutate({ id: deleteConfirm.id });
              else if (deleteConfirm.type === "category") deleteCategory.mutate({ id: deleteConfirm.id });
              setDeleteConfirm({ ...deleteConfirm, open: false });
            }}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
