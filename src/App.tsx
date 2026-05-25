import { Routes, Route, useLocation } from "react-router";
import { Suspense, lazy, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "./components/ThemeProvider";
import { AnimatePresence, motion } from "framer-motion";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import { getNextLoadingMessage } from "@/lib/loading-messages";

const Home = lazy(() => import("./pages/Home"));
const Events = lazy(() => import("./pages/Events"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const About = lazy(() => import("./pages/About"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const OngDashboard = lazy(() => import("./pages/OngDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Messages = lazy(() => import("./pages/Messages"));
const Profile = lazy(() => import("./pages/Profile"));
const Donations = lazy(() => import("./pages/Donations"));
const Certificates = lazy(() => import("./pages/Certificates"));
const Notifications = lazy(() => import("./pages/Notifications"));

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const scrollable = document.querySelector("main");
    if (scrollable) {
      scrollable.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return null;
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-warm-ocean border-t-transparent" />
      <p className="text-body-sm text-muted-foreground">{getNextLoadingMessage()}</p>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col relative">
        <div className="ambient-bg" />
        <div className="noise-overlay" />
        <ScrollToTop />
        <Navbar />
        <main className="flex-1 relative z-10">
          <PageWrapper>
            <Routes>
              <Route path="/" element={<Suspense fallback={<LoadingFallback />}><Home /></Suspense>} />
              <Route path="/eventos" element={<Suspense fallback={<LoadingFallback />}><Events /></Suspense>} />
              <Route path="/eventos/:id" element={<Suspense fallback={<LoadingFallback />}><EventDetail /></Suspense>} />
              <Route path="/sobre" element={<Suspense fallback={<LoadingFallback />}><About /></Suspense>} />
              <Route path="/dashboard" element={<Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense>} />
              <Route path="/ong" element={<Suspense fallback={<LoadingFallback />}><OngDashboard /></Suspense>} />
              <Route path="/admin" element={<Suspense fallback={<LoadingFallback />}><AdminDashboard /></Suspense>} />
              <Route path="/mensagens" element={<Suspense fallback={<LoadingFallback />}><Messages /></Suspense>} />
              <Route path="/perfil" element={<Suspense fallback={<LoadingFallback />}><Profile /></Suspense>} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/doacoes" element={<Suspense fallback={<LoadingFallback />}><Donations /></Suspense>} />
              <Route path="/certificados" element={<Suspense fallback={<LoadingFallback />}><Certificates /></Suspense>} />
              <Route path="/notificacoes" element={<Suspense fallback={<LoadingFallback />}><Notifications /></Suspense>} />
              <Route path="/termos" element={<Terms />} />
              <Route path="/privacidade" element={<Privacy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PageWrapper>
        </main>
        <Footer />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
