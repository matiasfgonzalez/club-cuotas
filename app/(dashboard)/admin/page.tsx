// Dashboard principal del administrador
// Muestra métricas y accesos rápidos

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  Users,
  Trophy,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function PaginaAdminDashboard() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/iniciar-sesion')
  }

  // Verificar que es administrador
  const usuario = await db.usuario.findUnique({
    where: { id: userId },
  })

  if (usuario?.rol !== 'ADMINISTRADOR') {
    redirect('/jugador')
  }

  // Obtener estadísticas
  const [
    totalJugadores,
    torneosActivos,
    pagosPendientes,
    cuotasVencidasCount,
    pagosRecientes,
  ] = await Promise.all([
    db.jugador.count(),
    db.torneo.count({ where: { activo: true } }),
    db.pago.count({ where: { estado: 'PENDIENTE' } }),
    db.cuotaJugador.count({
      where: {
        estadoPago: 'PENDIENTE',
        cuota: { fechaVencimiento: { lt: new Date() } },
      },
    }),
    db.pago.findMany({
      take: 5,
      orderBy: { fechaPago: 'desc' },
      include: {
        jugador: true,
        cuotaJugador: { include: { cuota: true } },
      },
    }),
  ])

  // Calcular recaudación del mes actual
  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const pagosAprobadosMes = await db.pago.aggregate({
    where: {
      estado: 'APROBADO',
      fechaAprobacion: { gte: inicioMes },
    },
    _sum: { monto: true },
  })

  const recaudacionMes = pagosAprobadosMes._sum.monto?.toNumber() ?? 0

  return (
    <div className="space-y-8">
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400 mt-1">
          Bienvenido, {usuario.nombreCompleto}
        </p>
      </div>

      {/* Métricas principales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Total Jugadores
            </CardTitle>
            <Users className="h-5 w-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totalJugadores}</div>
            <p className="text-xs text-zinc-500 mt-1">Jugadores registrados</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Torneos Activos
            </CardTitle>
            <Trophy className="h-5 w-5 text-teal-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{torneosActivos}</div>
            <p className="text-xs text-zinc-500 mt-1">En competencia</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Recaudación Mes
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              ${recaudacionMes.toLocaleString('es-AR')}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {format(new Date(), 'MMMM yyyy', { locale: es })}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Pagos Pendientes
            </CardTitle>
            <Clock className="h-5 w-5 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{pagosPendientes}</div>
            <p className="text-xs text-zinc-500 mt-1">Por aprobar</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {(cuotasVencidasCount > 0 || pagosPendientes > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {pagosPendientes > 0 && (
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">Pagos por revisar</h3>
                  <p className="text-sm text-zinc-400">
                    {pagosPendientes} pago{pagosPendientes > 1 ? 's' : ''} esperando
                    aprobación
                  </p>
                </div>
                <Button asChild variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                  <Link href="/admin/pagos">
                    Revisar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {cuotasVencidasCount > 0 && (
            <Card className="bg-red-500/5 border-red-500/20">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">Cuotas vencidas</h3>
                  <p className="text-sm text-zinc-400">
                    {cuotasVencidasCount} cuota{cuotasVencidasCount > 1 ? 's' : ''} sin
                    pagar
                  </p>
                </div>
                <Button asChild variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                  <Link href="/admin/cuotas">
                    Ver
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Accesos rápidos y pagos recientes */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Accesos rápidos */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Acciones rápidas</CardTitle>
            <CardDescription>Tareas frecuentes del sistema</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild variant="ghost" className="justify-start h-auto py-4 px-4 bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600 transition-all rounded-xl group">
              <Link href="/admin/torneos/nuevo">
                <div className="p-2 rounded-lg bg-emerald-500/10 mr-4 group-hover:bg-emerald-500/20 transition-colors">
                  <Trophy className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-white">Crear torneo</div>
                  <div className="text-xs text-zinc-400">Nueva competencia</div>
                </div>
              </Link>
            </Button>
            <Button asChild variant="ghost" className="justify-start h-auto py-4 px-4 bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600 transition-all rounded-xl group">
              <Link href="/admin/jugadores/nuevo">
                <div className="p-2 rounded-lg bg-teal-500/10 mr-4 group-hover:bg-teal-500/20 transition-colors">
                  <Users className="h-5 w-5 text-teal-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-white">Agregar jugador</div>
                  <div className="text-xs text-zinc-400">Nuevo integrante</div>
                </div>
              </Link>
            </Button>
            <Button asChild variant="ghost" className="justify-start h-auto py-4 px-4 bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600 transition-all rounded-xl group">
              <Link href="/admin/cuotas/nueva">
                <div className="p-2 rounded-lg bg-cyan-500/10 mr-4 group-hover:bg-cyan-500/20 transition-colors">
                  <CreditCard className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-white">Crear cuota</div>
                  <div className="text-xs text-zinc-400">Nueva cuota para jugadores</div>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Pagos recientes */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Pagos recientes</CardTitle>
              <CardDescription>Últimos pagos registrados</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-zinc-400">
              <Link href="/admin/pagos">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pagosRecientes.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-8">
                No hay pagos registrados aún
              </p>
            ) : (
              <div className="space-y-4">
                {pagosRecientes.map((pago) => (
                  <div
                    key={pago.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-medium">
                        {pago.jugador.nombre.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {pago.jugador.nombre}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {pago.cuotaJugador.cuota.nombre}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {pago.cuotaJugador.cuota.nombre}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">
                        ${pago.monto.toNumber().toLocaleString('es-AR')}
                      </p>
                      <Badge
                        variant="outline"
                        className={
                          pago.estado === 'APROBADO'
                            ? 'border-emerald-500/30 text-emerald-400'
                            : pago.estado === 'RECHAZADO'
                            ? 'border-red-500/30 text-red-400'
                            : 'border-amber-500/30 text-amber-400'
                        }
                      >
                        {pago.estado === 'APROBADO' && (
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                        )}
                        {pago.estado.toLowerCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
