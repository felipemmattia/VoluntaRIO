// Funções utilitárias auxiliares compartilhadas no frontend
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Combina classes CSS condicionalmente usando clsx e resolve conflitos do Tailwind usando twMerge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

