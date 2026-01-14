// Página principal - Landing page del sistema
// Muestra información del club y opciones de acceso

import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Trophy,
  Users,
  CreditCard,
  Shield,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'

export default async function PaginaInicio() {
  const { userId } = await auth()

  // Si ya está autenticado, redirigir al dashboard
  if (userId) {
    redirect('/jugador')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Encabezado */}
      <header className="border-b border-zinc-700/50 backdrop-blur-sm bg-zinc-900/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Club Cuotas</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" asChild className="text-zinc-300 hover:text-white">
              <Link href="/iniciar-sesion">Iniciar Sesión</Link>
            </Button>
            <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <Link href="/registrarse">Registrarse</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Héroe */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8">
            <CheckCircle2 className="w-4 h-4" />
            <span>Gestión simplificada de pagos</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Administra los pagos de tu{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              equipo de fútbol
            </span>
          </h1>
          <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            Sistema completo para gestionar cuotas, torneos y pagos de jugadores.
            Simplifica la administración y mantén todo organizado.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-6 text-lg"
            >
              <Link href="/registrarse">
                Comenzar ahora
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 px-8 py-6 text-lg"
            >
              <Link href="/iniciar-sesion">Ya tengo cuenta</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Características */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Todo lo que necesitas
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Herramientas diseñadas para facilitar la gestión de tu equipo
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="bg-zinc-800/50 border-zinc-700/50 hover:border-emerald-500/50 transition-all duration-300 group">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                <Trophy className="w-6 h-6 text-emerald-400" />
              </div>
              <CardTitle className="text-white">Múltiples Torneos</CardTitle>
              <CardDescription className="text-zinc-400">
                Organiza cuotas por torneo o competencia
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700/50 hover:border-emerald-500/50 transition-all duration-300 group">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mb-4 group-hover:bg-teal-500/20 transition-colors">
                <Users className="w-6 h-6 text-teal-400" />
              </div>
              <CardTitle className="text-white">Gestión de Jugadores</CardTitle>
              <CardDescription className="text-zinc-400">
                Administra perfiles e inscripciones
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700/50 hover:border-emerald-500/50 transition-all duration-300 group">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
                <CreditCard className="w-6 h-6 text-cyan-400" />
              </div>
              <CardTitle className="text-white">Control de Pagos</CardTitle>
              <CardDescription className="text-zinc-400">
                Flujo de aprobación de comprobantes
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700/50 hover:border-emerald-500/50 transition-all duration-300 group">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
                <Shield className="w-6 h-6 text-indigo-400" />
              </div>
              <CardTitle className="text-white">Roles y Permisos</CardTitle>
              <CardDescription className="text-zinc-400">
                Administradores y jugadores separados
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Final */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-br from-emerald-900/50 to-teal-900/50 border-emerald-500/20 max-w-4xl mx-auto">
          <CardContent className="p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              ¿Listo para comenzar?
            </h2>
            <p className="text-zinc-300 text-lg mb-8 max-w-2xl mx-auto">
              Registra tu equipo y comienza a gestionar los pagos de forma
              profesional hoy mismo.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-white text-emerald-900 hover:bg-zinc-100 px-8 py-6 text-lg font-semibold"
            >
              <Link href="/registrarse">
                Crear cuenta gratis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Pie de página */}
      <footer className="border-t border-zinc-800 py-8">
        <div className="container mx-auto px-4 text-center text-zinc-500 text-sm">
          <p>© {new Date().getFullYear()} Club Cuotas. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
