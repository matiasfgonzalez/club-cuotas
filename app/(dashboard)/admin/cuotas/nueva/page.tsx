// Página para crear nueva cuota

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { CuotaForm } from '../cuota-form'

export default async function PaginaNuevaCuota() {
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

  // Obtener torneos activos para el selector
  const torneos = await db.torneo.findMany({
    where: { activo: true },
    orderBy: { fechaInicio: 'desc' },
  })

  return (
    <div className="space-y-8">
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-white">Nueva Cuota</h1>
        <p className="text-zinc-400 mt-1">
          Crea una nueva cuota para un torneo
        </p>
      </div>

      {/* Formulario */}
      <CuotaForm torneos={torneos} />
    </div>
  )
}
