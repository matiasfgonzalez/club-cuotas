// Página de inicio de sesión
// Utiliza el componente SignIn de Clerk con estilos personalizados

import { SignIn } from '@clerk/nextjs'

export default function PaginaIniciarSesion() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Bienvenido de vuelta</h1>
          <p className="text-zinc-400">Ingresa a tu cuenta para continuar</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'bg-zinc-800/80 border-zinc-700 shadow-2xl',
              headerTitle: 'text-white',
              headerSubtitle: 'text-zinc-400',
              socialButtonsBlockButton:
                'bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600',
              socialButtonsBlockButtonText: 'text-white',
              dividerLine: 'bg-zinc-600',
              dividerText: 'text-zinc-400',
              formFieldLabel: 'text-zinc-300',
              formFieldInput:
                'bg-zinc-700 border-zinc-600 text-white placeholder:text-zinc-500',
              formButtonPrimary:
                'bg-emerald-500 hover:bg-emerald-600 text-white',
              footerActionLink: 'text-emerald-400 hover:text-emerald-300',
              identityPreviewText: 'text-white',
              identityPreviewEditButton: 'text-emerald-400',
            },
          }}
          routing="path"
          path="/iniciar-sesion"
          signUpUrl="/registrarse"
          forceRedirectUrl="/jugador"
        />
      </div>
    </div>
  )
}
