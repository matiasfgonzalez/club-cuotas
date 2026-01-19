// Página de reportes
// Dashboard con estadísticas y métricas del club

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Users,
  Trophy,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
} from 'lucide-react'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

export default async function PaginaReportes() {
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

  // Estadísticas generales
  const [
    totalJugadores,
    totalTorneos,
    totalCuotas,
    pagosAprobados,
    pagosPendientes,
    cuotasAsignadas,
  ] = await Promise.all([
    db.jugador.count({
      where: { activo: true },
    }),
    db.torneo.count({ where: { activo: true } }),
    db.cuota.count(),
    db.pago.findMany({
      where: { estado: 'APROBADO', eliminado: false },
      select: { monto: true },
    }),
    db.pago.count({ where: { estado: 'PENDIENTE', eliminado: false } }),
    db.cuotaJugador.findMany({
      include: {
        cuota: true,
        pagos: { where: { estado: 'APROBADO', eliminado: false } },
      },
    }),
  ])

  // Calcular totales
  const totalRecaudado = pagosAprobados.reduce(
    (sum, p) => sum + p.monto.toNumber(),
    0
  )

  const totalPendiente = cuotasAsignadas.reduce((sum, cj) => {
    if (cj.estadoPago === 'PAGADO') return sum
    const monto = cj.cuota.monto.toNumber()
    const pagado = cj.pagos.reduce((s, p) => s + p.monto.toNumber(), 0)
    return sum + (monto - pagado)
  }, 0)

  const cuotasAlDia = cuotasAsignadas.filter(
    (cj) => cj.estadoPago === 'PAGADO'
  ).length
  const cuotasPendientesCount = cuotasAsignadas.filter(
    (cj) => cj.estadoPago === 'PENDIENTE' || cj.estadoPago === 'PARCIAL'
  ).length

  const porcentajeRecaudado =
    totalRecaudado + totalPendiente > 0
      ? Math.round((totalRecaudado / (totalRecaudado + totalPendiente)) * 100)
      : 0

  // Pagos del mes actual
  const inicioMes = startOfMonth(new Date())
  const finMes = endOfMonth(new Date())
  const pagosMesActual = await db.pago.findMany({
    where: {
      estado: 'APROBADO',
      eliminado: false,
      fechaPago: {
        gte: inicioMes,
        lte: finMes,
      },
    },
    select: { monto: true },
  })
  const recaudadoMes = pagosMesActual.reduce(
    (sum, p) => sum + p.monto.toNumber(),
    0
  )

  // Pagos del mes anterior para comparación
  const inicioMesAnterior = startOfMonth(subMonths(new Date(), 1))
  const finMesAnterior = endOfMonth(subMonths(new Date(), 1))
  const pagosMesAnterior = await db.pago.findMany({
    where: {
      estado: 'APROBADO',
      eliminado: false,
      fechaPago: {
        gte: inicioMesAnterior,
        lte: finMesAnterior,
      },
    },
    select: { monto: true },
  })
  const recaudadoMesAnterior = pagosMesAnterior.reduce(
    (sum, p) => sum + p.monto.toNumber(),
    0
  )

  const variacionMensual =
    recaudadoMesAnterior > 0
      ? Math.round(
          ((recaudadoMes - recaudadoMesAnterior) / recaudadoMesAnterior) * 100
        )
      : 0

  // Jugadores con más deuda
  const jugadoresConDeuda = await db.jugador.findMany({
    include: {
      cuotasAsignadas: {
        where: {
          estadoPago: { in: ['PENDIENTE', 'PARCIAL'] },
        },
        include: {
          cuota: true,
          pagos: { where: { estado: 'APROBADO', eliminado: false } },
        },
      },
    },
  })

  const topDeudores = jugadoresConDeuda
    .map((j) => ({
      ...j,
      deuda: j.cuotasAsignadas.reduce((sum, cj) => {
        const monto = cj.cuota.monto.toNumber()
        const pagado = cj.pagos.reduce((s, p) => s + p.monto.toNumber(), 0)
        return sum + (monto - pagado)
      }, 0),
    }))
    .filter((j) => j.deuda > 0)
    .sort((a, b) => b.deuda - a.deuda)
    .slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-white">Reportes</h1>
        <p className="text-zinc-400 mt-1">
          Estadísticas y métricas del club
        </p>
      </div>

      {/* Métricas principales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Total Recaudado
            </CardTitle>
            <DollarSign className="h-5 w-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${totalRecaudado.toLocaleString('es-AR')}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {porcentajeRecaudado}% del total esperado
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Pendiente de Cobro
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${totalPendiente.toLocaleString('es-AR')}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {cuotasPendientesCount} cuotas pendientes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Recaudado este mes
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${recaudadoMes.toLocaleString('es-AR')}
            </div>
            <p
              className={`text-xs mt-1 ${
                variacionMensual >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {variacionMensual >= 0 ? '+' : ''}
              {variacionMensual}% vs mes anterior
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
            <div className="text-2xl font-bold text-white">{pagosPendientes}</div>
            <p className="text-xs text-zinc-500 mt-1">
              Por aprobar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumen general */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalJugadores}</p>
                <p className="text-sm text-zinc-500">Jugadores activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalTorneos}</p>
                <p className="text-sm text-zinc-500">Torneos activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalCuotas}</p>
                <p className="text-sm text-zinc-500">Cuotas creadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado de cuotas y Top deudores */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Estado de cuotas */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Estado de cuotas</CardTitle>
            <CardDescription>
              Distribución de cuotas por estado de pago
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-zinc-300">Pagadas</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-white font-medium">{cuotasAlDia}</span>
                  <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{
                        width: `${
                          cuotasAsignadas.length > 0
                            ? (cuotasAlDia / cuotasAsignadas.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400" />
                  <span className="text-zinc-300">Pendientes</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-white font-medium">
                    {cuotasPendientesCount}
                  </span>
                  <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500"
                      style={{
                        width: `${
                          cuotasAsignadas.length > 0
                            ? (cuotasPendientesCount / cuotasAsignadas.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top deudores */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Mayores deudores</CardTitle>
            <CardDescription>
              Jugadores con mayor deuda pendiente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topDeudores.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
                <p className="text-zinc-400">¡No hay deudores!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topDeudores.map((jugador, index) => (
                  <div
                    key={jugador.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-zinc-500">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-white">
                          {jugador.nombre}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {jugador.cuotasAsignadas.length} cuotas pendientes
                        </p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-amber-400">
                      ${jugador.deuda.toLocaleString('es-AR')}
                    </span>
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
