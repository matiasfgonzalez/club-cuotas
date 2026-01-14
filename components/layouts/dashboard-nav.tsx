// Componente de navegación del dashboard
// Versión desktop: sidebar fijo | Versión móvil: sheet

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Trophy,
  Users,
  CreditCard,
  FileText,
  Settings,
  Receipt,
  History,
  UserCircle,
} from 'lucide-react'

interface DashboardNavProps {
  esAdmin: boolean
}

// Enlaces para administradores
const enlacesAdmin = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/torneos', label: 'Torneos', icon: Trophy },
  { href: '/admin/jugadores', label: 'Jugadores', icon: Users },
  { href: '/admin/cuotas', label: 'Cuotas', icon: CreditCard },
  { href: '/admin/pagos', label: 'Pagos', icon: Receipt },
  { href: '/admin/reportes', label: 'Reportes', icon: FileText },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
]

// Enlaces para jugadores
const enlacesJugador = [
  { href: '/jugador', label: 'Mis Cuotas', icon: CreditCard },
  { href: '/jugador/pagos', label: 'Registrar Pago', icon: Receipt },
  { href: '/jugador/historial', label: 'Historial', icon: History },
  { href: '/jugador/perfil', label: 'Mi Perfil', icon: UserCircle },
]

export function DashboardNav({ esAdmin }: DashboardNavProps) {
  const pathname = usePathname()
  const enlaces = esAdmin ? enlacesAdmin : enlacesJugador

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-zinc-900 border-r border-zinc-800">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-800">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <span className="text-lg font-bold text-white">Club Cuotas</span>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {enlaces.map((enlace) => {
          const Icon = enlace.icon
          const isActive = pathname === enlace.href || 
            (enlace.href !== '/admin' && enlace.href !== '/jugador' && pathname.startsWith(enlace.href))

          return (
            <Link
              key={enlace.href}
              href={enlace.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              )}
            >
              <Icon className="w-5 h-5" />
              {enlace.label}
            </Link>
          )
        })}
      </nav>

      {/* Badge de rol */}
      <div className="px-4 py-4 border-t border-zinc-800">
        <div className={cn(
          'px-4 py-2 rounded-xl text-xs font-medium text-center',
          esAdmin 
            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        )}>
          {esAdmin ? 'Administrador' : 'Jugador'}
        </div>
      </div>
    </aside>
  )
}
