// Componente de navegación del dashboard
// Versión desktop: sidebar fijo colapsable | Versión móvil: sheet

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/providers/sidebar-provider'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
  Home,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'

interface DashboardNavProps {
  esAdmin: boolean
}

// Enlaces para administradores
const enlacesAdmin = [
  { href: '/jugador', label: 'Mis Cuotas', icon: Home },
  { href: '/jugador/perfil', label: 'Mi Perfil', icon: UserCircle },
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
  const { isCollapsed, toggle } = useSidebar()

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-zinc-900 border-r border-zinc-800 transition-all duration-300',
          isCollapsed ? 'md:w-[70px]' : 'md:w-64',
        )}
      >
        {/* Logo - clickeable hacia /jugador */}
        <Link
          href="/jugador"
          className={cn(
            'flex items-center gap-3 px-4 py-5 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors',
            isCollapsed && 'justify-center px-2',
          )}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold text-white">Club Cuotas</span>
          )}
        </Link>

        {/* Navegación */}
        <nav className="flex-1 px-2 py-6 space-y-1 overflow-y-auto">
          {enlaces.map((enlace) => {
            const Icon = enlace.icon
            const isActive =
              pathname === enlace.href ||
              (enlace.href !== '/admin' &&
                enlace.href !== '/jugador' &&
                pathname.startsWith(enlace.href))

            const linkContent = (
              <Link
                href={enlace.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  isCollapsed && 'justify-center px-3',
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800',
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && enlace.label}
              </Link>
            )

            if (isCollapsed) {
              return (
                <Tooltip key={enlace.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  >
                    {enlace.label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={enlace.href}>{linkContent}</div>
          })}
        </nav>

        {/* Botón de colapso y Badge de rol */}
        <div className="px-2 py-4 border-t border-zinc-800 space-y-3">
          {/* Badge de rol */}
          {!isCollapsed && (
            <div
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-medium text-center',
                esAdmin
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
              )}
            >
              {esAdmin ? 'Administrador' : 'Jugador'}
            </div>
          )}

          {/* Botón de toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggle}
                className={cn(
                  'w-full text-zinc-400 hover:text-white hover:bg-zinc-800',
                  isCollapsed && 'px-0',
                )}
              >
                {isCollapsed ? (
                  <PanelLeft className="h-5 w-5" />
                ) : (
                  <>
                    <PanelLeftClose className="h-5 w-5 mr-2" />
                    Ocultar menú
                  </>
                )}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent
                side="right"
                className="bg-zinc-800 border-zinc-700 text-white"
              >
                Expandir menú
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}
