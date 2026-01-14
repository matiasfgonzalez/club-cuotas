// Página para crear nuevo jugador

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { JugadorForm } from '../jugador-form'

export default async function PaginaNuevoJugador() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/iniciar-sesion')
  }

  const usuario = await db.usuario.findUnique({
    where: { id: userId },
  })

  if (usuario?.rol !== 'ADMINISTRADOR') {
    redirect('/jugador')
  }

  // Obtener torneos activos para posible inscripción
  const torneos = await db.torneo.findMany({
    where: { activo: true },
    orderBy: { fechaInicio: 'desc' },
  })

  return (
    <div className="space-y-8">
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-white">Nuevo Jugador</h1>
        <p className="text-zinc-400 mt-1">
          Registra un nuevo jugador en el sistema
        </p>
      </div>

      {/* Formulario */}
      <JugadorForm torneos={torneos} />
    </div>
  )
}
