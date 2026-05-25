import { Link } from "react-router";
import { EnvelopeSimple, MapPin } from "@phosphor-icons/react";

export function Footer() {
  return (
    <footer className="border-t" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
      <div className="container-warm py-16 sm:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.5fr_1fr_1fr] md:gap-16">
          <div className="space-y-5">
            <Link to="/" className="inline-block">
              <img src="/VoluntaRIO_Logo.png" alt="VoluntaRIO" width="110" height="28" loading="lazy" decoding="async" className="h-7 w-auto" />
            </Link>
            <p className="max-w-sm text-body text-pretty">
              Conectando pessoas e ONGs pela vida marinha. Uma iniciativa alinhada com os Objetivos de Desenvolvimento Sustentavel da ONU.
            </p>
            <a href="mailto:contato@voluntario.org" className="inline-flex items-center gap-1.5 text-sm font-medium text-warm-ocean underline underline-offset-4 transition-colors hover:text-warm-ocean-hover">
              <EnvelopeSimple weight="duotone" className="h-4 w-4" />contato@voluntario.org
            </a>
          </div>

          <div className="space-y-5">
            <h3 className="text-label">Navegação</h3>
            <ul className="space-y-3 text-body-sm">
              <li><Link to="/" className="text-muted-foreground transition-colors hover:text-warm-ocean hover:underline hover:decoration-2 hover:underline-offset-2">Inicio</Link></li>
              <li><Link to="/eventos" className="text-muted-foreground transition-colors hover:text-warm-ocean hover:underline hover:decoration-2 hover:underline-offset-2">Eventos</Link></li>
              <li><Link to="/sobre" className="text-muted-foreground transition-colors hover:text-warm-ocean hover:underline hover:decoration-2 hover:underline-offset-2">Sobre nos</Link></li>
              <li><Link to="/login" className="text-muted-foreground transition-colors hover:text-warm-ocean hover:underline hover:decoration-2 hover:underline-offset-2">Cadastre-se</Link></li>
            </ul>
          </div>

          <div className="space-y-5">
            <h3 className="text-label">Informações</h3>
            <ul className="space-y-3 text-body-sm text-muted-foreground">
              <li className="flex items-start gap-2"><MapPin weight="duotone" className="mt-0.5 h-4 w-4 shrink-0 text-warm-ocean" />Brasil</li>
              <li className="pt-2 text-caption leading-relaxed">TCC - ETEC Desenvolvimento de Sistemas</li>
              <li className="text-caption leading-relaxed">Felipe Mattia, Israel Silva, Davi Moura, Maria Almeida</li>
              <li className="pt-3 flex flex-wrap gap-3">
                <Link to="/termos" className="text-caption text-muted-foreground transition-colors hover:text-warm-ocean hover:underline hover:underline-offset-2">Termos de Uso</Link>
                <span className="text-caption text-muted-foreground">·</span>
                <Link to="/privacidade" className="text-caption text-muted-foreground transition-colors hover:text-warm-ocean hover:underline hover:underline-offset-2">Privacidade</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
          <p className="text-caption">2026 VoluntaRIO. Todos os direitos reservados.</p>
          <p className="text-caption">ODS 14 - Vida na Agua</p>
        </div>
      </div>
    </footer>
  );
}
