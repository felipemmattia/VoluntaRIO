// Hook customizado para detectar se a largura da tela corresponde a um dispositivo móvel.
import * as React from "react"

// Resolução limite em pixels que define o layout mobile (768px)
const MOBILE_BREAKPOINT = 768

// Hook que monitora a dimensão da tela e retorna se é um dispositivo mobile
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Registra um escutador para mudanças no tamanho da janela
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

