// Layout del dashboard
// Incluye navegación lateral y verificación de autenticación

import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { DashboardNav } from '@/components/layouts/dashboard-nav'
import { DashboardHeader } from '@/components/layouts/dashboard-header'
import {
  DashboardClientWrapper,
  DashboardMainContent,
} from '@/components/layouts/dashboard-client-wrapper'
import { notificarNuevoUsuario } from '@/lib/telegram'

// Forzar renderizado dinámico para evitar errores de build
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/iniciar-sesion')
  }

  const user = await currentUser()

  // Verificar si el usuario existe en la base de datos
  let usuario = await db.usuario.findUnique({
    where: { id: userId },
    include: { jugador: true },
  })

  // Si no existe, crearlo automáticamente (sin jugador asociado)
  if (!usuario && user) {
    const nombreCompleto =
      `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Usuario'
    const email = user.emailAddresses[0]?.emailAddress || ''

    usuario = await db.usuario.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email,
        nombreCompleto,
        rol: 'JUGADOR',
        // No se crea jugador automáticamente - debe asociarse después
      },
      include: { jugador: true },
    })

    // Notificar nuevo usuario por Telegram (no bloquea el flujo)
    notificarNuevoUsuario({ nombreCompleto, email }).catch(console.error)
  }

  const esAdmin = usuario?.rol === 'ADMINISTRADOR'

  return (
    <DashboardClientWrapper>
      <div className="min-h-screen bg-zinc-950">
        {/* Header móvil */}
        <DashboardHeader
          usuario={{
            nombreCompleto: usuario?.nombreCompleto || 'Usuario',
            email: usuario?.email || '',
            rol: usuario?.rol || 'JUGADOR',
          }}
          esAdmin={esAdmin}
        />

        <div className="flex">
          {/* Navegación lateral (desktop) */}
          <DashboardNav esAdmin={esAdmin} />

          {/* Contenido principal */}
          <DashboardMainContent>{children}</DashboardMainContent>
        </div>
      </div>
    </DashboardClientWrapper>
  )
}
