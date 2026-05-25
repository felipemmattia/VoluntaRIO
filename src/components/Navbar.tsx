import { Link, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "./ThemeProvider";
import { trpc } from "@/providers/trpc";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { List, Sun, Moon, SquaresFour, BuildingOffice, ShieldCheck, Chats, UserCircle, SignOut, BellSimple, Heart, Certificate } from "@phosphor-icons/react";
import { useState } from "react";
import { motion } from "framer-motion";
import { buttonHover } from "@/lib/motion-variants";

export function Navbar() {
  const { user, isAuthenticated, isAdmin, isOngManager, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const { data: unreadCount } = trpc.notification.getUnreadCount.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 30000 });

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: "/", label: "Inicio" },
    { path: "/eventos", label: "Eventos" },
    { path: "/sobre", label: "Sobre" },
  ];

  const authLinks = [
    ...(isAuthenticated ? [{ path: "/dashboard", label: "Painel", icon: SquaresFour }] : []),
    ...(isAuthenticated ? [{ path: "/notificacoes", label: "Notificações", icon: BellSimple }] : []),
    ...(isOngManager ? [{ path: "/ong", label: "ONG", icon: BuildingOffice }] : []),
    ...(isAdmin ? [{ path: "/admin", label: "Admin", icon: ShieldCheck }] : []),
    ...(isAuthenticated ? [{ path: "/mensagens", label: "Mensagens", icon: Chats }] : []),
    ...(isAuthenticated ? [{ path: "/doacoes", label: "Doações", icon: Heart }] : []),
    ...(isAuthenticated ? [{ path: "/certificados", label: "Certificados", icon: Certificate }] : []),
  ];

  const allLinks = [...navLinks, ...authLinks];

  return (
    <motion.nav
      className="nav-warm"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="container-warm flex h-16 items-center gap-6">
        <Link to="/" className="flex shrink-0 items-center">
          <img src="/VoluntaRIO_Logo.png" alt="VoluntaRIO" width="110" height="28" decoding="async" className="h-7 w-auto" />
        </Link>

        <div className="hidden md:flex md:flex-1 md:items-center md:gap-1">
          {navLinks.map((link) => (
            <motion.div
              key={link.path}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <Link
                to={link.path}
                className={`px-4 py-2 transition-colors duration-200 ${
                  isActive(link.path)
                    ? "nav-warm-link-active"
                    : "nav-warm-link"
                }`}
              >
                {link.label}
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <motion.button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
            aria-label={theme === "light" ? "Modo escuro" : "Modo claro"}
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            {theme === "light" ? <Moon weight="duotone" className="h-4 w-4" /> : <Sun weight="duotone" className="h-4 w-4" />}
          </motion.button>

          {isAuthenticated ? (
            <>
              <Link to="/notificacoes" className="hidden md:flex">
                <motion.button
                  type="button"
                  className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                  aria-label="Notificações"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <BellSimple weight="duotone" className="h-4 w-4" />
                  {unreadCount && unreadCount > 0 && (
                    <motion.span
                      className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(var(--warm-coral))] px-1 text-[10px] font-semibold text-[hsl(var(--warm-cream))]"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    >
                      {unreadCount}
                    </motion.span>
                  )}
                </motion.button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    type="button"
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-warm-ocean/10 text-warm-ocean"><UserCircle weight="duotone" className="h-3.5 w-3.5" /></div>
                    <span className="hidden max-w-[120px] truncate sm:inline">{user?.name ?? "Usuario"}</span>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem asChild><Link to="/perfil" className="flex items-center gap-2"><UserCircle weight="duotone" className="h-4 w-4" />Perfil</Link></DropdownMenuItem>
                  {isAdmin ? (
                    <DropdownMenuItem asChild><Link to="/admin" className="flex items-center gap-2"><ShieldCheck weight="duotone" className="h-4 w-4" />Admin</Link></DropdownMenuItem>
                  ) : isOngManager ? (
                    <DropdownMenuItem asChild><Link to="/ong" className="flex items-center gap-2"><BuildingOffice weight="duotone" className="h-4 w-4" />ONG</Link></DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild><Link to="/dashboard" className="flex items-center gap-2"><SquaresFour weight="duotone" className="h-4 w-4" />Painel</Link></DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive"><SignOut weight="duotone" className="h-4 w-4" />Sair</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/login">
              <motion.button
                type="button"
                className="btn-warm-primary"
                variants={buttonHover}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
              >
                Entrar
              </motion.button>
            </Link>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <motion.button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                aria-label="Menu"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <List weight="duotone" className="h-5 w-5" />
              </motion.button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <div className="flex flex-col gap-1 pt-6">
                {allLinks.map((link) => (
                  <motion.div
                    key={link.path}
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                        isActive(link.path) ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {"icon" in link && link.icon ? <link.icon className="h-4 w-4" /> : null}
                      {link.label}
                      {link.path === "/notificacoes" && unreadCount && unreadCount > 0 && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-warm-coral px-1.5 text-[10px] font-semibold text-white">{unreadCount}</span>
                      )}
                    </Link>
                  </motion.div>
                ))}
                {isAuthenticated && (
                  <motion.button
                    type="button"
                    className="mt-2 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-all duration-200 hover:bg-destructive/10"
                    onClick={() => { logout(); setOpen(false); }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SignOut weight="duotone" className="h-4 w-4" />Sair
                  </motion.button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.nav>
  );
}

