// Página de perfil del jugador
// Permite ver y editar datos personales

import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { PerfilForm } from './perfil-form'

export const dynamic = 'force-dynamic'

export default async function PaginaPerfil() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/iniciar-sesion')
  }

  const user = await currentUser()

  // Obtener datos del usuario
  const usuario = await db.usuario.findUnique({
    where: { id: userId },
    include: {
      jugador: true,
    },
  })

  if (!usuario) {
    redirect('/jugador')
  }

  return (
    <div className="space-y-8">
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-white">Mi Perfil</h1>
        <p className="text-zinc-400 mt-1">
          Administra tu información personal
        </p>
      </div>

      {/* Formulario de perfil */}
      <PerfilForm
        usuario={{
          id: usuario.id,
          email: usuario.email,
          nombreCompleto: usuario.nombreCompleto,
        }}
        jugador={usuario.jugador ? {
          id: usuario.jugador.id,
          telefono: usuario.jugador.telefono || '',
          dni: usuario.jugador.dni || '',
          cuit: usuario.jugador.cuit || '',
          obraSocial: usuario.jugador.obraSocial || '',
          fechaNacimiento: usuario.jugador.fechaNacimiento?.toISOString().split('T')[0] || '',
          posicion: usuario.jugador.posicion || '',
          numeroCamiseta: usuario.jugador.numeroCamiseta || undefined,
        } : null}
        clerkImageUrl={user?.imageUrl}
      />
    </div>
  )
}
