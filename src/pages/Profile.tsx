import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import FileUpload from "@/components/FileUpload";
import {
  User,
  MapPin,
  Phone,
  Certificate,
  BookOpen,
  Heart,
  FloppyDisk,
  Gear,
  BuildingOffice,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp, fadeInDown, staggerContainer, buttonHover, scaleIn } from "@/lib/motion-variants";

const BRAZIL_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export default function Profile() {
  const { isAuthenticated, isLoading, user, isAdmin, isOngManager, isVolunteer } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const { data: volunteerProfile } = trpc.volunteer.getMyProfile.useQuery(undefined, {
    enabled: isAuthenticated && isVolunteer,
  });

  const { data: ongProfile } = trpc.ong.getMyProfile.useQuery(undefined, {
    enabled: isAuthenticated && isOngManager,
  });

  const profile = isOngManager ? ongProfile : volunteerProfile;

  const utils = trpc.useUtils();

  const updateVolunteerProfile = trpc.volunteer.createOrUpdate.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado! Sua história inspira outros voluntários.");
      setIsEditing(false);
      utils.volunteer.getMyProfile.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateOngProfile = trpc.ong.createOrUpdate.useMutation({
    onSuccess: () => {
      toast.success("Perfil da ONG atualizado com sucesso!");
      setIsEditing(false);
      utils.ong.getMyProfile.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateProfile = isOngManager ? updateOngProfile : updateVolunteerProfile;

  if (isLoading) return null;
  if (!isAuthenticated) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    if (isOngManager) {
      updateProfile.mutate({
        id: (profile as any)?.id,
        displayName: data.get("displayName") as string,
        mission: data.get("mission") as string,
        description: data.get("description") as string,
        phone: data.get("phone") as string,
        email: data.get("email") as string,
        city: data.get("city") as string,
        state: data.get("state") as string,
        website: data.get("website") as string,
        address: data.get("address") as string,
        autoAccept: data.get("autoAccept") === "on",
      });
    } else {
      updateProfile.mutate({
        bio: data.get("bio") as string,
        phone: data.get("phone") as string,
        city: data.get("city") as string,
        state: data.get("state") as string,
        certifications: data.get("certifications") as string,
        experience: data.get("experience") as string,
        interests: data.get("interests") as string,
        shareLocation: data.get("shareLocation") === "on",
      });
    }
  };

  const roleLabel =
    user?.role === "admin"
      ? "Administrador"
      : user?.role === "ong_manager"
      ? "Gerente de ONG"
      : "Voluntário";

  return (
    <motion.div
      className="min-h-screen py-14 sm:py-16 lg:py-[60px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container-warm section-warm-tight">
        <motion.div
          className="mx-auto max-w-2xl"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.h1 className="text-headline mb-8" variants={fadeInUp}>Meu perfil</motion.h1>

          {/* User Info */}
          <motion.div className="card-warm mb-6" variants={fadeInUp}>
            <div className="flex items-center gap-4">
              <div className="relative">
                <motion.div
                  className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[hsl(var(--warm-ocean-light))]"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User weight="duotone" className="h-8 w-8" style={{ color: "hsl(var(--warm-ocean))" }} />
                  )}
                </motion.div>
                <div className="absolute -bottom-1 -right-1">
                  <FileUpload type="avatar" label="" onUploadComplete={() => {}} />
                </div>
              </div>
              <div>
                <h2 className="text-title text-[1.125rem]">{user?.name ?? "Usuário"}</h2>
                <p className="text-body-sm" style={{ color: "hsl(var(--text-muted))" }}>{user?.email}</p>
                <motion.span className="badge-warm mt-1.5 inline-flex" whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                  {roleLabel}
                </motion.span>
              </div>
            </div>
          </motion.div>

          {/* Profile Form */}
          <motion.div className="card-warm" variants={fadeInUp}>
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
              <div className="flex items-center gap-2">
                <Gear weight="duotone" className="h-5 w-5" style={{ color: "hsl(var(--text-muted))" }} />
                <h2 className="text-title text-[1.125rem]">
                  {isAdmin ? "Informações do administrador" : isOngManager ? "Informações da ONG" : "Informações do voluntário"}
                </h2>
              </div>
              {!isEditing && (
                <motion.button className="btn-warm-secondary rounded-xl" onClick={() => setIsEditing(true)} variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap">
                  Editar
                </motion.button>
              )}
            </div>

            <div className="pt-4">
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.form
                    key="edit"
                    onSubmit={handleSubmit}
                    className="space-y-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isOngManager ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="displayName">Nome da ONG</Label>
                          <Input
                            id="displayName"
                            name="displayName"
                            defaultValue={(profile as any)?.displayName ?? ""}
                            placeholder="Nome da sua ONG"
                            className="input-warm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mission">Missão</Label>
                          <Textarea
                            id="mission"
                            name="mission"
                            defaultValue={(profile as any)?.mission ?? ""}
                            placeholder="Qual a missão da sua ONG?"
                            rows={2}
                            className="input-warm resize-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Descrição</Label>
                          <Textarea
                            id="description"
                            name="description"
                            defaultValue={(profile as any)?.description ?? ""}
                            placeholder="Descreva sua ONG"
                            rows={3}
                            className="input-warm resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">Cidade</Label>
                            <Input
                              id="city"
                              name="city"
                              defaultValue={(profile as any)?.city ?? ""}
                              placeholder="Cidade"
                              className="input-warm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">Estado</Label>
                            <select
                              id="state"
                              name="state"
                              defaultValue={(profile as any)?.state ?? ""}
                              className="input-warm"
                            >
                              <option value="">Selecione</option>
                              {BRAZIL_STATES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            name="phone"
                            defaultValue={(profile as any)?.phone ?? ""}
                            placeholder="(XX) XXXXX-XXXX"
                            className="input-warm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">E-mail de contato</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            defaultValue={(profile as any)?.email ?? ""}
                            placeholder="contato@ong.org"
                            className="input-warm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            name="website"
                            defaultValue={(profile as any)?.website ?? ""}
                            placeholder="https://ong.org"
                            className="input-warm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="address">Endereço</Label>
                          <Input
                            id="address"
                            name="address"
                            defaultValue={(profile as any)?.address ?? ""}
                            placeholder="Endereço completo"
                            className="input-warm"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            id="autoAccept"
                            name="autoAccept"
                            defaultChecked={(profile as any)?.autoAccept ?? false}
                          />
                          <Label htmlFor="autoAccept" className="text-body-sm font-normal">
                            Aceitação automática de voluntários
                          </Label>
                        </div>
                      </>
                    ) : (
                      <>
                        {[
                          { id: "bio", label: "Biografia", type: "textarea", rows: 3, placeholder: "Conte um pouco sobre você..." },
                          { id: "certifications", label: "Certificações", type: "textarea", rows: 2, placeholder: "Suas certificações (opcional)" },
                          { id: "experience", label: "Experiência", type: "textarea", rows: 2, placeholder: "Sua experiência (opcional)" },
                        ].map((field) => (
                          <div key={field.id} className="space-y-2">
                            <Label htmlFor={field.id}>{field.label}</Label>
                            {field.type === "textarea" ? (
                              <Textarea
                                id={field.id}
                                name={field.id}
                                defaultValue={profile?.[field.id as keyof typeof profile] ?? ""}
                                placeholder={field.placeholder}
                                rows={field.rows}
                                className="input-warm resize-none"
                              />
                            ) : null}
                          </div>
                        ))}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">Cidade</Label>
                            <Input
                              id="city"
                              name="city"
                              defaultValue={profile?.city ?? ""}
                              placeholder="Sua cidade"
                              className="input-warm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">Estado</Label>
                            <select
                              id="state"
                              name="state"
                              defaultValue={profile?.state ?? ""}
                              className="input-warm"
                            >
                              <option value="">Selecione</option>
                              {BRAZIL_STATES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            name="phone"
                            defaultValue={profile?.phone ?? ""}
                            placeholder="(XX) XXXXX-XXXX"
                            className="input-warm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="interests">Interesses (separados por vírgula)</Label>
                          <Input
                            id="interests"
                            name="interests"
                            defaultValue={profile?.interests ?? ""}
                            placeholder="Limpeza de praias, corais, tartarugas..."
                            className="input-warm"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            id="shareLocation"
                            name="shareLocation"
                            defaultChecked={profile?.shareLocation ?? true}
                          />
                          <Label htmlFor="shareLocation" className="text-body-sm font-normal">
                            Compartilhar localização para recomendações
                          </Label>
                        </div>
                      </>
                    )}

                    <div className="flex gap-2 pt-2">
                      <motion.button type="submit" className="btn-warm-primary rounded-xl gap-2" disabled={updateProfile.isPending} variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap">
                        <FloppyDisk weight="duotone" className="h-4 w-4" />
                        {updateProfile.isPending ? "Salvando..." : "Salvar"}
                      </motion.button>
                      <motion.button
                        type="button"
                        className="btn-warm-secondary rounded-xl"
                        onClick={() => setIsEditing(false)}
                        variants={buttonHover}
                        initial="rest"
                        whileHover="hover"
                        whileTap="tap"
                      >
                        Cancelar
                      </motion.button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div
                    key="view"
                    className="space-y-5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {profile ? (
                      <>
                        {isOngManager ? (
                          <>
                            {(profile as any)?.displayName && (
                              <motion.div className="space-y-1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                                <Label className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>Nome da ONG</Label>
                                <p className="text-body-sm font-medium">{(profile as any).displayName}</p>
                              </motion.div>
                            )}

                            {(profile as any)?.mission && (
                              <motion.div className="space-y-1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                                <Label className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>Missão</Label>
                                <p className="text-body-sm leading-relaxed text-pretty">{(profile as any).mission}</p>
                              </motion.div>
                            )}

                            {(profile as any)?.description && (
                              <motion.div className="space-y-1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                                <Label className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>Descrição</Label>
                                <p className="text-body-sm leading-relaxed text-pretty">{(profile as any).description}</p>
                              </motion.div>
                            )}

                            <motion.div className="grid grid-cols-2 gap-4" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                              {(profile as any)?.city && (
                                <div className="space-y-1">
                                  <Label className="flex items-center gap-1 text-xs" style={{ color: "hsl(var(--text-muted))" }}>
                                    <MapPin weight="duotone" className="h-3 w-3" />
                                    Localização
                                  </Label>
                                  <p className="text-body-sm">{(profile as any).city}, {(profile as any).state}</p>
                                </div>
                              )}
                              {(profile as any)?.phone && (
                                <div className="space-y-1">
                                  <Label className="flex items-center gap-1 text-xs" style={{ color: "hsl(var(--text-muted))" }}>
                                    <Phone weight="duotone" className="h-3 w-3" />
                                    Telefone
                                  </Label>
                                  <p className="text-body-sm">{(profile as any).phone}</p>
                                </div>
                              )}
                            </motion.div>

                            {(profile as any)?.email && (
                              <motion.div className="space-y-1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                                <Label className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>E-mail de contato</Label>
                                <p className="text-body-sm">{(profile as any).email}</p>
                              </motion.div>
                            )}

                            {(profile as any)?.website && (
                              <motion.div className="space-y-1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
                                <Label className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>Website</Label>
                                <p className="text-body-sm">{(profile as any).website}</p>
                              </motion.div>
                            )}

                            {(profile as any)?.address && (
                              <motion.div className="space-y-1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                                <Label className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>Endereço</Label>
                                <p className="text-body-sm">{(profile as any).address}</p>
                              </motion.div>
                            )}

                            <motion.div className="border-t pt-4" style={{ borderColor: "hsl(var(--border) / 0.5)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
                              <div className="flex items-center gap-2 text-body-sm" style={{ color: "hsl(var(--text-muted))" }}>
                                Aceitação automática: {(profile as any)?.autoAccept ? "Ativada" : "Desativada"}
                              </div>
                            </motion.div>
                          </>
                        ) : (
                          <>
                            {profile.bio && (
                              <motion.div className="space-y-1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                                <Label className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>Biografia</Label>
                                <p className="text-body-sm leading-relaxed text-pretty">{profile.bio}</p>
                              </motion.div>
                            )}

                            <motion.div className="grid grid-cols-2 gap-4" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                              {profile.city && (
                                <div className="space-y-1">
                                  <Label className="flex items-center gap-1 text-xs" style={{ color: "hsl(var(--text-muted))" }}>
                                    <MapPin weight="duotone" className="h-3 w-3" />
                                    Localização
                                  </Label>
                                  <p className="text-body-sm">{profile.city}, {profile.state}</p>
                                </div>
                              )}
                              {profile.phone && (
                                <div className="space-y-1">
                                  <Label className="flex items-center gap-1 text-xs" style={{ color: "hsl(var(--text-muted))" }}>
                                    <Phone weight="duotone" className="h-3 w-3" />
                                    Telefone
                                  </Label>
                                  <p className="text-body-sm">{profile.phone}</p>
                                </div>
                              )}
                            </motion.div>

                            {profile.certifications && (
                              <motion.div className="space-y-1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                                <Label className="flex items-center gap-1 text-xs" style={{ color: "hsl(var(--text-muted))" }}>
                                  <Certificate weight="duotone" className="h-3 w-3" />
                                  Certificações
                                </Label>
                                <p className="text-body-sm leading-relaxed text-pretty">{profile.certifications}</p>
                              </motion.div>
                            )}

                            {profile.experience && (
                              <motion.div className="space-y-1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                                <Label className="flex items-center gap-1 text-xs" style={{ color: "hsl(var(--text-muted))" }}>
                                  <BookOpen className="h-3 w-3" />
                                  Experiência
                                </Label>
                                <p className="text-body-sm leading-relaxed text-pretty">{profile.experience}</p>
                              </motion.div>
                            )}

                            {profile.interests && (
                              <motion.div className="space-y-1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                                <Label className="flex items-center gap-1 text-xs" style={{ color: "hsl(var(--text-muted))" }}>
                                  <Heart weight="duotone" className="h-3 w-3" />
                                  Interesses
                                </Label>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {profile.interests.split(",").map((i) => (
                                    <motion.span key={i} className="badge-warm-sand rounded-full px-3 py-1 text-xs font-semibold" whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                                      {i.trim()}
                                    </motion.span>
                                  ))}
                                </div>
                              </motion.div>
                            )}

                            <motion.div className="border-t pt-4" style={{ borderColor: "hsl(var(--border) / 0.5)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
                              <div className="flex items-center gap-2 text-body-sm" style={{ color: "hsl(var(--text-muted))" }}>
                                <MapPin weight="duotone" className="h-4 w-4" />
                                Localização: {profile.shareLocation ? "Compartilhada" : "Privada"}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </>
                    ) : (
                      <motion.div
                        className="py-10 text-center"
                        initial="hidden"
                        animate="visible"
                        variants={scaleIn}
                      >
                        <motion.div variants={fadeInUp}>
                          {isOngManager ? (
                            <BuildingOffice weight="duotone" className="mx-auto mb-4 h-10 w-10" style={{ color: "hsl(var(--text-muted))" }} />
                          ) : (
                            <User weight="duotone" className="mx-auto mb-4 h-10 w-10" style={{ color: "hsl(var(--text-muted))" }} />
                          )}
                        </motion.div>
                        <motion.p className="mb-1 text-body-sm font-medium" variants={fadeInUp}>Perfil incompleto</motion.p>
                        <motion.p className="mb-4 text-body-sm text-pretty" variants={fadeInUp} style={{ color: "hsl(var(--text-muted))" }}>
                          {isOngManager
                            ? "Preencha as informações da sua ONG para que voluntários possam conhecer seu trabalho."
                            : "Contar sua história ajuda ONGs a entenderem seu perfil e conectarem você a eventos ideais."}
                        </motion.p>
                        <motion.button onClick={() => setIsEditing(true)} className="btn-warm-primary rounded-xl" variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap">
                          Completar perfil
                        </motion.button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
