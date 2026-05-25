// Arquivo de inicialização e montagem do aplicativo React na árvore DOM.
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import { TRPCProvider } from "@/providers/trpc"
import App from './App.tsx'

// Identificador do cliente Google OAuth para o fluxo de autenticação externa
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

if (!GOOGLE_CLIENT_ID) {
  throw new Error("VITE_GOOGLE_CLIENT_ID não definida no .env")
}

// Renderização do aplicativo encapsulado nos providers necessários (Roteamento, Login Google e tRPC)
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <TRPCProvider>
        <App />
      </TRPCProvider>
    </GoogleOAuthProvider>
  </BrowserRouter>,
)

