// Página 404 personalizada
// No usa autenticación para evitar errores de build

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Trophy, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-8">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-4">
          Página no encontrada
        </h2>
        <p className="text-zinc-400 mb-8">
          Lo sentimos, la página que buscas no existe o fue movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Ir al inicio
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-zinc-600 text-zinc-300 hover:bg-zinc-800">
            <Link href="javascript:history.back()">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver atrás
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
