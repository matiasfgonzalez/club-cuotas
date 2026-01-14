// Página para crear nuevo torneo

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { TorneoForm } from '../torneo-form'

export default async function PaginaNuevoTorneo() {
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

  return (
    <div className="space-y-8">
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-white">Nuevo Torneo</h1>
        <p className="text-zinc-400 mt-1">
          Crea un nuevo torneo o competencia
        </p>
      </div>

      {/* Formulario */}
      <TorneoForm />
    </div>
  )
}
