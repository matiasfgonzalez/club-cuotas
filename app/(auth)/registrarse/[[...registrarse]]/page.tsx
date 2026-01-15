// Página de registro
// Utiliza el componente SignUp de Clerk con estilos personalizados

import { SignUp } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

export default function PaginaRegistrarse() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Crear Cuenta</h1>
          <p className="text-zinc-400">Únete a Club Cuotas para comenzar</p>
        </div>
        <SignUp
          appearance={{
            baseTheme: dark,
            variables: {
                colorPrimary: '#10b981', // emerald-500
                colorBackground: '#18181b', // zinc-900
                colorInputBackground: '#27272a', // zinc-800
                colorText: 'white',
                colorInputText: 'white',
            },
            elements: {
                rootBox: 'w-full',
                card: 'bg-zinc-900 border border-zinc-800 shadow-xl w-full',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white',
                socialButtonsBlockButtonText: 'text-white font-medium',
                dividerLine: 'bg-zinc-700',
                dividerText: 'text-zinc-400',
                formFieldLabel: 'text-zinc-300',
                formFieldInput: 'bg-zinc-800 border-zinc-700 text-white focus:border-emerald-500 transition-colors',
                footerActionText: 'text-zinc-400',
                footerActionLink: 'text-emerald-400 hover:text-emerald-300',
                identityPreviewText: 'text-zinc-300',
                formButtonPrimary: 'bg-emerald-500 hover:bg-emerald-600 text-white',
            }
          }}
          routing="path"
          path="/registrarse"
          signInUrl="/iniciar-sesion"
          forceRedirectUrl="/jugador"
        />
      </div>
    </div>
  )
}
