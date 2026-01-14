// Página de bienvenida para usuarios sin jugador asociado
// Permite solicitar asociación ingresando el CUIT

import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { SolicitudAsociacionForm } from './solicitud-asociacion-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { UserCircle, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PaginaBienvenida() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/iniciar-sesion')
  }

  const user = await currentUser()

  const usuario = await db.usuario.findUnique({
    where: { id: userId },
    include: { jugador: true },
  })

  // Si ya tiene jugador asociado, redirigir al dashboard
  if (usuario?.jugador) {
    redirect('/jugador')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Mensaje de bienvenida */}
      <div className="text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
          <UserCircle className="h-12 w-12 text-emerald-400" />
        </div>
        <h1 className="text-3xl font-bold text-white">
          ¡Bienvenido, {usuario?.nombreCompleto || user?.firstName || 'Usuario'}!
        </h1>
        <p className="text-zinc-400 mt-2">
          Tu cuenta ha sido creada exitosamente
        </p>
      </div>

      {/* Aviso */}
      <Card className="bg-amber-500/10 border-amber-500/30">
        <CardContent className="flex items-start gap-4 pt-6">
          <AlertCircle className="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-400">
              No tienes un perfil de jugador asociado
            </h3>
            <p className="text-zinc-300 text-sm mt-1">
              Para ver tus cuotas y datos del club, necesitas estar asociado a un perfil de jugador.
              Si eres jugador del club, ingresa tu CUIT para solicitar la asociación.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Formulario de solicitud */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Solicitar asociación</CardTitle>
          <CardDescription>
            Ingresa tu CUIT para vincularte con tu perfil de jugador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SolicitudAsociacionForm />
        </CardContent>
      </Card>

      {/* Información de contacto */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6 text-center">
          <p className="text-zinc-400 text-sm">
            ¿No conoces tu CUIT o tienes problemas?
          </p>
          <p className="text-zinc-300 text-sm mt-1">
            Contacta al administrador del club para que te asigne manualmente.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
