// Página de detalle de cuota (admin)

import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  Users,
  Trophy,
  Pencil,
  AlertTriangle,
  CheckCircle,
  Clock,
  CircleDollarSign,
} from 'lucide-react'
import { format, isPast } from 'date-fns'
import { es } from 'date-fns/locale'
import { EliminarCuotaDialog } from './eliminar-cuota-dialog'
import { GestionarJugadoresDialog } from './gestionar-jugadores-dialog'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PaginaDetalleCuota({ params }: PageProps) {
  const { id } = await params
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

  // Obtener cuota con todas sus relaciones
  const cuota = await db.cuota.findUnique({
    where: { id },
    include: {
      torneo: true,
      asignaciones: {
        include: {
          jugador: true,
          pagos: {
            where: { estado: 'APROBADO' },
            orderBy: { fechaPago: 'desc' },
          },
        },
        orderBy: { jugador: { nombre: 'asc' } },
      },
    },
  })

  if (!cuota) {
    notFound()
  }

  // Obtener jugadores del torneo que no tienen la cuota asignada
  const jugadoresDelTorneo = await db.jugador.findMany({
    where: {
      activo: true,
      inscripciones: {
        some: { torneoId: cuota.torneoId },
      },
      NOT: {
        cuotasAsignadas: {
          some: { cuotaId: cuota.id },
        },
      },
    },
    orderBy: { nombre: 'asc' },
  })

  // Calcular estadísticas
  const totalAsignaciones = cuota.asignaciones.length
  const pagadasCompleto = cuota.asignaciones.filter(
    (a) => a.estadoPago === 'PAGADO',
  ).length
  const parciales = cuota.asignaciones.filter(
    (a) => a.estadoPago === 'PARCIAL',
  ).length
  const pendientes = cuota.asignaciones.filter(
    (a) => a.estadoPago === 'PENDIENTE',
  ).length
  const vencida = isPast(cuota.fechaVencimiento)

  // Calcular recaudación
  const montoTotal = cuota.asignaciones.reduce((acc, a) => {
    const monto = a.montoPersonalizado
      ? Number(a.montoPersonalizado)
      : Number(cuota.monto)
    return acc + monto
  }, 0)

  const montoRecaudado = cuota.asignaciones.reduce((acc, a) => {
    const pagosAprobados = a.pagos.reduce((sum, p) => sum + Number(p.monto), 0)
    return acc + pagosAprobados
  }, 0)

  // Mapeo de tipos de cuota
  const tiposCuota: Record<string, string> = {
    UNICA: 'Única',
    MENSUAL: 'Mensual',
    INSCRIPCION: 'Inscripción',
    EXTRAORDINARIA: 'Extraordinaria',
  }

  const estadosBadge: Record<
    string,
    { className: string; icon: React.ReactNode }
  > = {
    PAGADO: {
      className: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
      icon: <CheckCircle className="h-3 w-3" />,
    },
    PARCIAL: {
      className: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
      icon: <CircleDollarSign className="h-3 w-3" />,
    },
    PENDIENTE: {
      className: 'border-zinc-600 text-zinc-400 bg-zinc-800',
      icon: <Clock className="h-3 w-3" />,
    },
  }

  const estadosLabel: Record<string, string> = {
    PAGADO: 'Pagado',
    PARCIAL: 'Parcial',
    PENDIENTE: 'Pendiente',
  }

  return (
    <div className="space-y-8 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
          <Button
            variant="outline"
            size="icon"
            asChild
            className="border-zinc-700 text-zinc-300 shrink-0"
          >
            <Link href="/admin/cuotas">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
                {cuota.nombre}
              </h1>
              <Badge
                variant="outline"
                className="border-emerald-500/30 text-emerald-400 shrink-0"
              >
                {tiposCuota[cuota.tipo]}
              </Badge>
              {vencida && (
                <Badge
                  variant="outline"
                  className="border-red-500/30 text-red-400 shrink-0"
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Vencida
                </Badge>
              )}
            </div>
            {cuota.descripcion && (
              <p className="text-zinc-400 text-sm sm:text-base">
                {cuota.descripcion}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            asChild
            className="border-zinc-700 text-zinc-300 flex-1 sm:flex-none"
          >
            <Link href={`/admin/cuotas/${cuota.id}/editar`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <EliminarCuotaDialog cuotaId={cuota.id} cuotaNombre={cuota.nombre} />
        </div>
      </div>

      {/* Tarjetas de información */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800 min-w-0">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-zinc-400">Monto</p>
                <p className="text-lg sm:text-xl font-bold text-white truncate">
                  ${Number(cuota.monto).toLocaleString('es-AR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 min-w-0">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-zinc-400">Vencimiento</p>
                <p
                  className={`text-base sm:text-xl font-bold truncate ${
                    vencida ? 'text-red-400' : 'text-white'
                  }`}
                >
                  {format(cuota.fechaVencimiento, 'd MMM yyyy', { locale: es })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 min-w-0">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-zinc-400">Torneo</p>
                <p className="text-sm sm:text-lg font-semibold text-white truncate">
                  {cuota.torneo.nombre}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 min-w-0">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <CircleDollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-zinc-400">Recaudado</p>
                <p className="text-base sm:text-xl font-bold text-white truncate">
                  ${montoRecaudado.toLocaleString('es-AR')}
                  <span className="text-xs sm:text-sm text-zinc-500 font-normal">
                    {' '}
                    / ${montoTotal.toLocaleString('es-AR')}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumen de estados */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-400" />
                Jugadores asignados ({totalAsignaciones})
              </CardTitle>
              <CardDescription>
                Estado de pago de cada jugador para esta cuota
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge
                variant="outline"
                className="border-emerald-500/30 text-emerald-400"
              >
                {pagadasCompleto} pagadas
              </Badge>
              {parciales > 0 && (
                <Badge
                  variant="outline"
                  className="border-amber-500/30 text-amber-400"
                >
                  {parciales} parciales
                </Badge>
              )}
              <Badge
                variant="outline"
                className="border-zinc-600 text-zinc-400"
              >
                {pendientes} pendientes
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Barra de progreso */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-400">Progreso de recaudación</span>
              <span className="text-white font-medium">
                {totalAsignaciones > 0
                  ? Math.round((pagadasCompleto / totalAsignaciones) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{
                  width: `${
                    totalAsignaciones > 0
                      ? (pagadasCompleto / totalAsignaciones) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Tabla de jugadores */}
          {cuota.asignaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-12 w-12 text-zinc-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Sin jugadores asignados
              </h3>
              <p className="text-zinc-500 text-sm mb-4">
                Agrega jugadores para comenzar a gestionar los pagos
              </p>
              <GestionarJugadoresDialog
                cuotaId={cuota.id}
                jugadoresDisponibles={jugadoresDelTorneo}
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-400">Jugador</TableHead>
                      <TableHead className="text-zinc-400">Monto</TableHead>
                      <TableHead className="text-zinc-400">Estado</TableHead>
                      <TableHead className="text-zinc-400 hidden sm:table-cell">
                        Pagado
                      </TableHead>
                      <TableHead className="text-zinc-400 hidden md:table-cell">
                        Último pago
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cuota.asignaciones.map((asignacion) => {
                      const montoAsignado = asignacion.montoPersonalizado
                        ? Number(asignacion.montoPersonalizado)
                        : Number(cuota.monto)
                      const montoPagado = asignacion.pagos.reduce(
                        (sum, p) => sum + Number(p.monto),
                        0,
                      )
                      const ultimoPago = asignacion.pagos[0]

                      return (
                        <TableRow
                          key={asignacion.id}
                          className="border-zinc-800 hover:bg-zinc-800/50"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                                <span className="text-sm font-medium text-zinc-300">
                                  {asignacion.jugador.nombre
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-white">
                                  {asignacion.jugador.nombre}
                                </p>
                                {asignacion.jugador.numeroCamiseta && (
                                  <p className="text-xs text-zinc-500">
                                    #{asignacion.jugador.numeroCamiseta}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-white">
                              ${montoAsignado.toLocaleString('es-AR')}
                            </span>
                            {asignacion.montoPersonalizado && (
                              <Badge
                                variant="outline"
                                className="ml-2 border-blue-500/30 text-blue-400 text-xs"
                              >
                                Personalizado
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${
                                estadosBadge[asignacion.estadoPago].className
                              } flex items-center gap-1 w-fit`}
                            >
                              {estadosBadge[asignacion.estadoPago].icon}
                              {estadosLabel[asignacion.estadoPago]}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <span
                              className={
                                montoPagado >= montoAsignado
                                  ? 'text-emerald-400'
                                  : 'text-white'
                              }
                            >
                              ${montoPagado.toLocaleString('es-AR')}
                            </span>
                            <span className="text-zinc-500">
                              {' '}
                              / ${montoAsignado.toLocaleString('es-AR')}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {ultimoPago ? (
                              <span className="text-zinc-300">
                                {format(ultimoPago.fechaPago, 'd MMM yyyy', {
                                  locale: es,
                                })}
                              </span>
                            ) : (
                              <span className="text-zinc-500">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Botón para agregar más jugadores */}
              {jugadoresDelTorneo.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <GestionarJugadoresDialog
                    cuotaId={cuota.id}
                    jugadoresDisponibles={jugadoresDelTorneo}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
