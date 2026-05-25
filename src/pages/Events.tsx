import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { trpc } from "@/providers/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { MagnifyingGlass, MapPin, Calendar, Funnel, SlidersHorizontal, Compass, X } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp, fadeInDown, staggerContainer, cardHover, buttonHover, scaleIn } from "@/lib/motion-variants";

const EXPERIENCE_LEVELS = [
  { value: "todos", label: "Todos os níveis" },
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
];

const BRAZIL_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export default function Events() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") ? parseInt(searchParams.get("category")!) : undefined;

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(initialCategory);
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [sortBy, setSortBy] = useState<"distance" | "date" | "newest">("date");
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [useGps, setUseGps] = useState(false);

  const { data: categories } = trpc.category.listWithSubcategories.useQuery();

  const filters = useMemo(() => {
    const f: Record<string, unknown> = { sortBy };
    if (selectedCategory) f.categoryId = selectedCategory;
    if (selectedState) f.state = selectedState;
    if (selectedCity) f.city = selectedCity;
    if (selectedLevel) f.experienceLevel = selectedLevel;
    if (search) f.search = search;
    if (useGps && userLocation) { f.userLat = userLocation.lat; f.userLon = userLocation.lon; }
    return f;
  }, [selectedCategory, selectedState, selectedCity, selectedLevel, sortBy, search, useGps, userLocation]);

  const { data: events, isLoading } = trpc.event.list.useQuery(filters);

  const getGpsLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => { setUserLocation({ lat: position.coords.latitude, lon: position.coords.longitude }); setUseGps(true); },
        () => { setUseGps(false); }
      );
    }
  };

  const clearFilters = () => { setSearch(""); setSelectedCategory(undefined); setSelectedState(""); setSelectedCity(""); setSelectedLevel(""); setSortBy("date"); setUseGps(false); };

  const hasActiveFilters = search || selectedCategory || selectedState || selectedCity || selectedLevel || useGps;
  const activeFilterCount = [selectedCategory, selectedState, selectedCity, selectedLevel, useGps].filter(Boolean).length;

  return (
    <motion.div
      className="min-h-screen bg-[hsl(var(--warm-cream))]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header Section */}
      <section className="section-warm section-warm-tight">
        <div className="container-warm">
          <motion.div
            className="space-y-3"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.h1 className="text-headline" variants={fadeInUp}>
              Eventos de voluntariado
            </motion.h1>
            <motion.p className="text-body-lg text-pretty" variants={fadeInUp}>
              Encontre oportunidades para contribuir com a preservacao marinha.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Search & Filter Section */}
      <section className="section-warm-tight bg-[hsl(var(--surface-subtle))]">
        <div className="container-warm">
          <motion.div
            className="flex flex-col gap-4 lg:flex-row lg:items-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div className="relative flex-1" variants={fadeInUp}>
              <MagnifyingGlass weight="duotone" className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--text-muted))]" />
              <motion.input
                type="text"
                placeholder="Buscar por nome, cidade ou estado..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-warm pl-10"
                whileFocus={{ scale: 1.005, borderColor: "hsl(var(--warm-ocean))" }}
                transition={{ duration: 0.2 }}
              />
            </motion.div>
            <motion.div className="flex flex-wrap items-center gap-2" variants={fadeInUp}>
              <motion.button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 min-h-[42px] ${
                  showFilters
                    ? "btn-warm-primary"
                    : "btn-warm-secondary"
                }`}
                variants={buttonHover}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
              >
                <SlidersHorizontal weight="duotone" className="h-4 w-4" />
                Filtros
                {activeFilterCount > 0 && (
                  <motion.span
                    className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-[10px] font-semibold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    {activeFilterCount}
                  </motion.span>
                )}
              </motion.button>
              <motion.button
                type="button"
                onClick={getGpsLocation}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 min-h-[42px] ${
                  useGps
                    ? "btn-warm-primary"
                    : "btn-warm-secondary"
                }`}
                variants={buttonHover}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
              >
                <Compass weight="duotone" className="h-4 w-4" />
                GPS
              </motion.button>
              <motion.select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                aria-label="Ordenar por"
                className="input-warm w-auto rounded-xl"
                whileHover={{ scale: 1.02 }}
                whileFocus={{ scale: 1.02, borderColor: "hsl(var(--warm-ocean))" }}
                transition={{ duration: 0.2 }}
              >
                <option value="date">Data</option>
                <option value="distance">Proximidade</option>
                <option value="newest">Mais recentes</option>
              </motion.select>
            </motion.div>
          </motion.div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                className="card-warm mt-6"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="text-label">Categoria</label>
                    <select
                      value={selectedCategory?.toString() ?? ""}
                      onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : undefined)}
                      className="input-warm"
                    >
                      <option value="">Todas categorias</option>
                      {categories?.map((cat) => (
                        <optgroup key={cat.id} label={cat.name}>
                          <option value={cat.id.toString()}>Todos</option>
                          {cat.subcategories?.map((sub) => (
                            <option key={sub.id} value={sub.id.toString()}>↳ {sub.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </motion.div>
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <label className="text-label">Estado</label>
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className="input-warm"
                    >
                      <option value="">Todos estados</option>
                      {BRAZIL_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </motion.div>
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="text-label">Cidade</label>
                    <motion.input
                      type="text"
                      placeholder="Filtrar por cidade"
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="input-warm"
                      whileFocus={{ scale: 1.005, borderColor: "hsl(var(--warm-ocean))" }}
                      transition={{ duration: 0.2 }}
                    />
                  </motion.div>
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <label className="text-label">Nível de experiência</label>
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="input-warm"
                    >
                      {EXPERIENCE_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  </motion.div>
                </div>
                <AnimatePresence>
                  {hasActiveFilters && (
                    <motion.div
                      className="mt-5 flex justify-end"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.button
                        type="button"
                        onClick={clearFilters}
                        className="btn-warm-ghost gap-1.5"
                        variants={buttonHover}
                        initial="rest"
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <X weight="duotone" className="h-4 w-4" />
                        Limpar filtros
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Results Section */}
      <section className="section-warm">
        <div className="container-warm">
          {/* Results count */}
          {!isLoading && events && (
            <motion.p
              className="mb-8 text-caption"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {events.length} {events.length === 1 ? "evento encontrado" : "eventos encontrados"}
            </motion.p>
          )}

          {/* Events Grid */}
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : events && events.length > 0 ? (
            <motion.div
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              {events.map((event) => (
                <Link key={event.id} to={`/eventos/${event.id}`}>
                  <motion.div
                    className="card-warm group !p-0 overflow-hidden"
                    variants={cardHover}
                    initial="rest"
                    whileHover="hover"
                  >
                    {event.mainImageUrl ? (
                      <div className="relative h-44 overflow-hidden">
                        <img src={event.mainImageUrl} alt={event.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <motion.span
                            className="badge-warm"
                            style={{ backgroundColor: event.categoryColor + "18", color: event.categoryColor }}
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                          >
                            {event.categoryName}
                          </motion.span>
                        </div>
                        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                          {event.distance !== null && event.distance !== undefined && (
                            <span className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
                              <MapPin weight="duotone" className="h-3 w-3" />
                              {event.distance.toFixed(0)}km
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="relative h-44 bg-[hsl(var(--warm-sand))] flex items-center justify-center">
                        <div className="absolute top-3 left-3 flex gap-2">
                          <motion.span
                            className="badge-warm"
                            style={{ backgroundColor: event.categoryColor + "18", color: event.categoryColor }}
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                          >
                            {event.categoryName}
                          </motion.span>
                        </div>
                        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                          {event.distance !== null && event.distance !== undefined && (
                            <span className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
                              <MapPin weight="duotone" className="h-3 w-3" />
                              {event.distance.toFixed(0)}km
                            </span>
                          )}
                        </div>
                        <Calendar weight="duotone" className="h-12 w-12 text-[hsl(var(--warm-ocean))/30]" />
                      </div>
                    )}
                    <div className="p-5">
                      <motion.h3
                        className="text-title mb-2 line-clamp-2"
                        whileHover={{ color: "hsl(var(--warm-ocean))" }}
                        transition={{ duration: 0.2 }}
                      >
                        {event.title}
                      </motion.h3>
                      <p className="text-body-sm mb-4 line-clamp-2">{event.description}</p>
                      <div className="space-y-2 text-caption">
                        <div className="flex items-center gap-1.5">
                          <Calendar weight="duotone" className="h-3.5 w-3.5 shrink-0" />
                          {new Date(event.eventDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin weight="duotone" className="h-3.5 w-3.5 shrink-0" />
                          {event.city}, {event.state}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between pt-3 divider-warm">
                        <span className="text-body-sm font-medium">{event.ongName}</span>
                        <div className="flex items-center gap-2">
                          <motion.span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                              event.spotsLeft > 0 ? "badge-warm-sand" : "badge-warm-coral"
                            }`}
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                          >
                            {event.spotsLeft > 0 ? `${event.enrolledCount}/${event.maxVolunteers}` : "Lotado"}
                          </motion.span>
                          <span className="badge-warm-sand">
                            {EXPERIENCE_LEVELS.find((l) => l.value === event.experienceLevel)?.label ?? event.experienceLevel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="card-warm flex flex-col items-center justify-center py-20 text-center"
              initial="hidden"
              animate="visible"
              variants={scaleIn}
            >
              <motion.div
                variants={fadeInUp}
              >
                <Funnel weight="duotone" className="mb-4 h-12 w-12 text-[hsl(var(--text-muted))]" />
              </motion.div>
              <motion.h3 className="text-title mb-2" variants={fadeInUp}>
                Nenhum evento encontrado
              </motion.h3>
              <motion.p className="text-body mb-6 text-pretty" variants={fadeInUp}>
                Os oceanos sao vastos, mas os eventos ainda nao apareceram com esses filtros. Tente ajustar sua busca.
              </motion.p>
              <AnimatePresence>
                {hasActiveFilters && (
                  <motion.button
                    type="button"
                    onClick={clearFilters}
                    className="btn-warm-secondary gap-1.5"
                    variants={buttonHover}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <X weight="duotone" className="h-4 w-4" />
                    Limpar filtros
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
