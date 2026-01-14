// Componente del header del dashboard
// Incluye navegación móvil y menú de usuario

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Menu,
  Trophy,
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  Settings,
  Receipt,
  History,
  UserCircle,
  Home,
} from 'lucide-react'
import { useState } from 'react'

interface DashboardHeaderProps {
  usuario: {
    nombreCompleto: string
    email: string
    rol: string
  }
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

export function DashboardHeader({ usuario, esAdmin }: DashboardHeaderProps) {
  const pathname = usePathname()
  const enlaces = esAdmin ? enlacesAdmin : enlacesJugador
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/80 md:ml-64">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Botón menú móvil */}
        <div className="flex items-center gap-4 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-zinc-400">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-zinc-900 border-zinc-800 p-0">
              <SheetHeader className="px-6 py-5 border-b border-zinc-800">
                <SheetTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-lg font-bold text-white">Club Cuotas</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4 py-6">
                {enlaces.map((enlace) => {
                  const Icon = enlace.icon
                  const isActive = pathname === enlace.href || 
                    (enlace.href !== '/admin' && enlace.href !== '/jugador' && pathname.startsWith(enlace.href))

                  return (
                    <Link
                      key={enlace.href}
                      href={enlace.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
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
              <div className="px-4 py-4 border-t border-zinc-800 mt-auto">
                <div className={cn(
                  'px-4 py-2 rounded-xl text-xs font-medium text-center',
                  esAdmin 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                )}>
                  {esAdmin ? 'Administrador' : 'Jugador'}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo móvil - clickeable hacia /jugador */}
        <Link href="/jugador" className="flex items-center gap-2 md:hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-white">Club Cuotas</span>
        </Link>

        {/* Espacio vacío en desktop */}
        <div className="hidden md:block" />

        {/* Usuario y acciones */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-white">{usuario.nombreCompleto}</p>
            <p className="text-xs text-zinc-500">{usuario.email}</p>
          </div>
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-10 h-10',
                userButtonPopoverCard: 'bg-zinc-800 border-zinc-700',
                userButtonPopoverActionButton: 'text-zinc-300 hover:bg-zinc-700',
                userButtonPopoverActionButtonText: 'text-zinc-300',
                userButtonPopoverFooter: 'hidden',
              },
            }}
          />
        </div>
      </div>
    </header>
  )
}
