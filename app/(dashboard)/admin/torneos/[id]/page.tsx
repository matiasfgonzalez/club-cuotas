// Página de detalle de torneo con gestión de jugadores

import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
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
  Trophy,
  Users,
  CreditCard,
  ArrowLeft,
  Calendar,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AgregarJugadorDialog } from './agregar-jugador-dialog'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PaginaDetalleTorneo({ params }: PageProps) {
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

  // Obtener torneo con inscripciones y cuotas
  const torneo = await db.torneo.findUnique({
    where: { id },
    include: {
      inscripciones: {
        include: {
          jugador: {
            include: {
              usuarios: true,
              cuotasAsignadas: {
                where: {
                  cuota: { torneoId: id },
                },
                include: {
                  cuota: true,
                  pagos: { where: { eliminado: false } },
                },
              },
            },
          },
        },
        orderBy: { fechaInscripcion: 'desc' },
      },
      cuotas: {
        orderBy: { fechaVencimiento: 'asc' },
      },
    },
  })

  if (!torneo) {
    notFound()
  }

  // Obtener jugadores no inscritos para el diálogo
  const jugadoresInscritos = torneo.inscripciones.map((i) => i.jugadorId)
  const jugadoresDisponibles = await db.jugador.findMany({
    where: {
      id: {
        notIn: jugadoresInscritos.length > 0 ? jugadoresInscritos : ['none'],
      },
      activo: true,
    },
    include: { usuarios: true },
    orderBy: { nombre: 'asc' },
  })

  // Calcular estadísticas por jugador
  const jugadoresConEstado = torneo.inscripciones.map((inscripcion) => {
    const cuotasDelTorneo = inscripcion.jugador.cuotasAsignadas
    const totalCuotas = cuotasDelTorneo.length
    const cuotasPagadas = cuotasDelTorneo.filter(
      (cj) => cj.estadoPago === 'PAGADO',
    ).length
    const cuotasPendientes = cuotasDelTorneo.filter(
      (cj) => cj.estadoPago === 'PENDIENTE' || cj.estadoPago === 'PARCIAL',
    ).length

    const deudaTotal = cuotasDelTorneo.reduce((sum, cj) => {
      if (cj.estadoPago === 'PAGADO') return sum
      const monto =
        cj.montoPersonalizado?.toNumber() || cj.cuota.monto.toNumber()
      const pagado = cj.pagos
        .filter((p) => p.estado === 'APROBADO')
        .reduce((s, p) => s + p.monto.toNumber(), 0)
      return sum + (monto - pagado)
    }, 0)

    return {
      inscripcion,
      jugador: inscripcion.jugador,
      usuarios: inscripcion.jugador.usuarios,
      totalCuotas,
      cuotasPagadas,
      cuotasPendientes,
      deudaTotal,
      estado:
        cuotasPendientes === 0 && totalCuotas > 0
          ? 'AL_DIA'
          : cuotasPendientes > 0
          ? 'PENDIENTE'
          : 'SIN_CUOTAS',
    }
  })

  const totalRecaudado = torneo.inscripciones.reduce((sum, inscripcion) => {
    return (
      sum +
      inscripcion.jugador.cuotasAsignadas.reduce((s, cj) => {
        return (
          s +
          cj.pagos
            .filter((p) => p.estado === 'APROBADO')
            .reduce((ps, p) => ps + p.monto.toNumber(), 0)
        )
      }, 0)
    )
  }, 0)

  const totalPendiente = jugadoresConEstado.reduce(
    (sum, j) => sum + j.deudaTotal,
    0,
  )

  return (
    <div className="space-y-8 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
          <Button
            variant="outline"
            size="icon"
            asChild
            className="border-zinc-700 shrink-0"
          >
            <Link href="/admin/torneos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
                {torneo.nombre}
              </h1>
              <Badge
                variant="outline"
                className={
                  torneo.activo
                    ? 'border-emerald-500/30 text-emerald-400'
                    : 'border-zinc-600 text-zinc-400'
                }
              >
                {torneo.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            {torneo.descripcion && (
              <p className="text-zinc-400 mt-1">{torneo.descripcion}</p>
            )}
          </div>
        </div>
        <AgregarJugadorDialog
          torneoId={torneo.id}
          torneoNombre={torneo.nombre}
          jugadoresDisponibles={jugadoresDisponibles.map((j) => ({
            id: j.id,
            nombre: j.nombre,
            email: j.usuarios[0]?.email || 'Sin usuario',
          }))}
        />
      </div>

      {/* Info del torneo */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800 min-w-0">
          <CardContent className="p-3 sm:pt-6 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-zinc-500">Inicio</p>
                <p className="text-white font-medium text-sm sm:text-base truncate">
                  {format(torneo.fechaInicio, 'd MMM yyyy', {
                    locale: es,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 min-w-0">
          <CardContent className="p-3 sm:pt-6 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-zinc-500">Jugadores</p>
                <p className="text-white font-medium">
                  {torneo.inscripciones.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 min-w-0">
          <CardContent className="p-3 sm:pt-6 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-zinc-500">Recaudado</p>
                <p className="text-white font-medium text-sm sm:text-base truncate">
                  ${totalRecaudado.toLocaleString('es-AR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 min-w-0">
          <CardContent className="p-3 sm:pt-6 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-zinc-500">Pendiente</p>
                <p className="text-white font-medium text-sm sm:text-base truncate">
                  ${totalPendiente.toLocaleString('es-AR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cuotas del torneo */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-400" />
              Cuotas del torneo
            </CardTitle>
            <CardDescription>
              {torneo.cuotas.length} cuotas configuradas
            </CardDescription>
          </div>
          <Button
            asChild
            size="sm"
            className="bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto"
          >
            <Link href={`/admin/cuotas/nueva?torneo=${torneo.id}`}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva cuota
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {torneo.cuotas.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">
              No hay cuotas configuradas para este torneo
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {torneo.cuotas.map((cuota) => (
                <div
                  key={cuota.id}
                  className="p-4 rounded-xl border border-zinc-700 bg-zinc-800/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-white">{cuota.nombre}</p>
                    <Badge
                      variant="outline"
                      className="text-xs font-semibold bg-zinc-700/50 text-white border-zinc-600 px-3 py-1 uppercase tracking-wider"
                    >
                      {cuota.tipo}
                    </Badge>
                  </div>
                  <p className="text-lg font-bold text-emerald-400">
                    ${cuota.monto.toNumber().toLocaleString('es-AR')}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Vence:{' '}
                    {format(cuota.fechaVencimiento, "d 'de' MMMM", {
                      locale: es,
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Jugadores inscritos */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-400" />
            Jugadores inscritos
          </CardTitle>
          <CardDescription>
            Estado de pagos de cada jugador en este torneo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jugadoresConEstado.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                No hay jugadores inscritos
              </h3>
              <p className="text-zinc-500 text-sm mb-4">
                Agrega jugadores a este torneo para gestionar sus cuotas
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase">
                      Jugador
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-zinc-500 uppercase hidden sm:table-cell">
                      Cuotas
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-zinc-500 uppercase">
                      Estado
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase">
                      Deuda
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {jugadoresConEstado.map(
                    ({
                      jugador,
                      usuarios,
                      cuotasPagadas,
                      cuotasPendientes,
                      deudaTotal,
                      estado,
                    }) => (
                      <tr
                        key={jugador.id}
                        className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                      >
                        <td className="py-4 px-4">
                          <Link
                            href={`/admin/jugadores/${jugador.id}`}
                            className="hover:underline"
                          >
                            <p className="font-medium text-white">
                              {jugador.nombre}
                            </p>
                            <p className="text-sm text-zinc-500">
                              {usuarios[0]?.email || 'Sin usuario asociado'}
                            </p>
                          </Link>
                        </td>
                        <td className="py-4 px-4 text-center hidden sm:table-cell">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-emerald-400">
                              {cuotasPagadas}
                            </span>
                            <span className="text-zinc-600">/</span>
                            <span className="text-zinc-400">
                              {cuotasPagadas + cuotasPendientes}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {estado === 'AL_DIA' && (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Al día
                            </Badge>
                          )}
                          {estado === 'PENDIENTE' && (
                            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                              <Clock className="h-3 w-3 mr-1" />
                              Pendiente
                            </Badge>
                          )}
                          {estado === 'SIN_CUOTAS' && (
                            <Badge className="bg-zinc-500/10 text-zinc-400 border-zinc-500/30">
                              Sin cuotas
                            </Badge>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span
                            className={`font-medium ${
                              deudaTotal > 0
                                ? 'text-amber-400'
                                : 'text-zinc-500'
                            }`}
                          >
                            ${deudaTotal.toLocaleString('es-AR')}
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
