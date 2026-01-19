// Página de aprobación de pagos
// Lista de pagos pendientes para aprobar o rechazar

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Clock, CheckCircle2, XCircle, ExternalLink, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { BotonAprobacion } from '@/components/forms/boton-aprobacion'
import { BotonEliminarPago } from '@/components/forms/boton-eliminar-pago'
import { RegistrarPagoDialog } from './registrar-pago-dialog'

export default async function PaginaPagos() {
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

  const [pagosPendientes, pagosAprobados, pagosRechazados, pagosEliminados, torneosActivos] =
    await Promise.all([
      db.pago.findMany({
        where: { estado: 'PENDIENTE', eliminado: false },
        include: {
          jugador: true,
          cuotaJugador: {
            include: { cuota: { include: { torneo: true } } },
          },
        },
        orderBy: { fechaPago: 'desc' },
      }),
      db.pago.findMany({
        where: { estado: 'APROBADO', eliminado: false },
        take: 50,
        include: {
          jugador: true,
          cuotaJugador: {
            include: { cuota: { include: { torneo: true } } },
          },
          aprobadoPor: true,
        },
        orderBy: { fechaAprobacion: 'desc' },
      }),
      db.pago.findMany({
        where: { estado: 'RECHAZADO', eliminado: false },
        take: 50,
        include: {
          jugador: true,
          cuotaJugador: {
            include: { cuota: { include: { torneo: true } } },
          },
          aprobadoPor: true,
        },
        orderBy: { fechaAprobacion: 'desc' },
      }),
      // Pagos eliminados
      db.pago.findMany({
        where: { eliminado: true },
        take: 50,
        include: {
          jugador: true,
          cuotaJugador: {
            include: { cuota: { include: { torneo: true } } },
          },
          eliminadoPor: true,
        },
        orderBy: { fechaEliminacion: 'desc' },
      }),
      // Obtener torneos activos para el diálogo de pago manual
      db.torneo.findMany({
        where: { activo: true },
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' },
      }),
    ])

  // Serializar datos para evitar error de Decimal en Client Components
  // Usamos JSON.parse/stringify con un replacer para convertir Decimals
  const serializarDatos = <T,>(datos: T): T => {
    return JSON.parse(JSON.stringify(datos, (_, value) => {
      // Si es un objeto Decimal de Prisma, convertir a número
      if (value && typeof value === 'object' && 'toNumber' in value && typeof value.toNumber === 'function') {
        return value.toNumber()
      }
      return value
    }))
  }

  const pagosPendientesSerializados = serializarDatos(pagosPendientes)
  const pagosAprobadosSerializados = serializarDatos(pagosAprobados)
  const pagosRechazadosSerializados = serializarDatos(pagosRechazados)
  const pagosEliminadosSerializados = serializarDatos(pagosEliminados)

  return (
    <div className="space-y-8 overflow-hidden">
      {/* Título y acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Gestión de Pagos
          </h1>
          <p className="text-zinc-400 mt-1 text-sm sm:text-base">
            Revisa y aprueba los pagos registrados por los jugadores
          </p>
        </div>
        <div className="w-full sm:w-auto shrink-0">
          <RegistrarPagoDialog torneos={torneosActivos} />
        </div>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {pagosPendientesSerializados.length}
              </p>
              <p className="text-sm text-zinc-400">Pendientes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {pagosAprobadosSerializados.length}
              </p>
              <p className="text-sm text-zinc-400">Aprobados (últimos)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {pagosRechazadosSerializados.length}
              </p>
              <p className="text-sm text-zinc-400">Rechazados (últimos)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de pagos */}
      <Tabs defaultValue="pendientes" className="space-y-4">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="bg-zinc-800 border-zinc-700 w-max sm:w-auto">
            <TabsTrigger
              value="pendientes"
              className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400 text-xs sm:text-sm"
            >
              <Clock className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden xs:inline">Pendientes</span>
              <span className="xs:hidden">Pend.</span>
              <span className="ml-1">({pagosPendientesSerializados.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="aprobados"
              className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-xs sm:text-sm"
            >
              <CheckCircle2 className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden xs:inline">Aprobados</span>
              <span className="xs:hidden">Aprob.</span>
            </TabsTrigger>
            <TabsTrigger
              value="rechazados"
              className="data-[state=active]:bg-red-500/10 data-[state=active]:text-red-400 text-xs sm:text-sm"
            >
              <XCircle className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden xs:inline">Rechazados</span>
              <span className="xs:hidden">Rech.</span>
            </TabsTrigger>
            <TabsTrigger
              value="eliminados"
              className="data-[state=active]:bg-zinc-500/10 data-[state=active]:text-zinc-400 text-xs sm:text-sm"
            >
              <Trash2 className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden xs:inline">Eliminados</span>
              <span className="xs:hidden">Elim.</span>
              {pagosEliminadosSerializados.length > 0 && <span className="ml-1">({pagosEliminadosSerializados.length})</span>}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pendientes" className="space-y-4">
          {pagosPendientesSerializados.length === 0 ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  ¡Todo al día!
                </h3>
                <p className="text-zinc-500 text-sm text-center">
                  No hay pagos pendientes de revisión
                </p>
              </CardContent>
            </Card>
          ) : (
            pagosPendientesSerializados.map((pago) => (
              <Card key={pago.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4">
                    {/* Info del pago */}
                    <div className="flex items-start gap-3 sm:gap-4">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-base sm:text-lg">
                          {pago.jugador.nombre.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="font-semibold text-white truncate">
                          {pago.jugador.nombre}
                        </h4>
                        <p className="text-sm text-zinc-400 truncate">
                          {pago.cuotaJugador.cuota.nombre} •{' '}
                          {pago.cuotaJugador.cuota.torneo.nombre}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-zinc-500">
                          <span className="truncate">
                            {format(pago.fechaPago, "d 'de' MMM, HH:mm", {
                              locale: es,
                            })}
                          </span>
                          <Badge
                            variant="outline"
                            className="border-zinc-600 text-zinc-400"
                          >
                            {pago.metodo.replace('_', ' ')}
                          </Badge>
                        </div>
                        {pago.notas && (
                          <p className="text-sm text-zinc-500 mt-2">
                            Nota: {pago.notas}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Monto y acciones */}
                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-zinc-800 sm:border-0 sm:pt-0">
                      <div>
                        <p className="text-xl sm:text-2xl font-bold text-white">
                          ${Number(pago.monto).toLocaleString('es-AR')}
                        </p>
                        {pago.comprobante && (
                          <a
                            href={pago.comprobante}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Ver comprobante
                          </a>
                        )}
                      </div>
                      <BotonAprobacion pagoId={pago.id} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="aprobados" className="space-y-4">
          {pagosAprobadosSerializados.length === 0 ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-8 text-center">
                <p className="text-zinc-500">No hay pagos aprobados aún</p>
              </CardContent>
            </Card>
          ) : (
            pagosAprobadosSerializados.map((pago) => (
              <Card key={pago.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-emerald-500/20 text-emerald-400">
                          {pago.jugador.nombre.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">
                          {pago.jugador.nombre}
                        </p>
                        <p className="text-sm text-zinc-500 truncate">
                          {pago.cuotaJugador.cuota.nombre}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right flex flex-col sm:items-end gap-2">
                      <div>
                        <p className="font-semibold text-white">
                          ${Number(pago.monto).toLocaleString('es-AR')}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">
                          Aprobado por {pago.aprobadoPor?.nombreCompleto}
                        </p>
                      </div>
                      <BotonEliminarPago 
                        pagoId={pago.id}
                        nombreJugador={pago.jugador.nombre}
                        nombreCuota={pago.cuotaJugador.cuota.nombre}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="rechazados" className="space-y-4">
          {pagosRechazadosSerializados.length === 0 ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-8 text-center">
                <p className="text-zinc-500">No hay pagos rechazados</p>
              </CardContent>
            </Card>
          ) : (
            pagosRechazadosSerializados.map((pago) => (
              <Card key={pago.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-red-500/20 text-red-400">
                          {pago.jugador.nombre.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">
                          {pago.jugador.nombre}
                        </p>
                        <p className="text-sm text-zinc-500 truncate">
                          {pago.cuotaJugador.cuota.nombre}
                        </p>
                        {pago.notas && (
                          <p className="text-xs text-red-400 mt-1">
                            Motivo: {pago.notas}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-left sm:text-right flex flex-col sm:items-end gap-2">
                      <div>
                        <p className="font-semibold text-white">
                          ${Number(pago.monto).toLocaleString('es-AR')}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">
                          Rechazado por {pago.aprobadoPor?.nombreCompleto}
                        </p>
                      </div>
                      <BotonEliminarPago 
                        pagoId={pago.id}
                        nombreJugador={pago.jugador.nombre}
                        nombreCuota={pago.cuotaJugador.cuota.nombre}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="eliminados" className="space-y-4">
          {pagosEliminadosSerializados.length === 0 ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-8 text-center">
                <Trash2 className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-500">No hay pagos eliminados</p>
              </CardContent>
            </Card>
          ) : (
            pagosEliminadosSerializados.map((pago) => (
              <Card key={pago.id} className="bg-zinc-900 border-zinc-800 border-l-2 border-l-zinc-600">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-zinc-500/20 text-zinc-400">
                          {pago.jugador.nombre.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">
                          {pago.jugador.nombre}
                        </p>
                        <p className="text-sm text-zinc-500 truncate">
                          {pago.cuotaJugador.cuota.nombre}
                        </p>
                        <div className="mt-2 p-2 bg-zinc-800/50 rounded-lg">
                          <p className="text-xs text-zinc-400 mb-1">Motivo de eliminación:</p>
                          <p className="text-sm text-zinc-300">{pago.motivoEliminacion}</p>
                        </div>
                        <p className="text-xs text-zinc-500 mt-2">
                          Eliminado por {pago.eliminadoPor?.nombreCompleto} el{' '}
                          {pago.fechaEliminacion && format(pago.fechaEliminacion, "d 'de' MMM yyyy, HH:mm", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-semibold text-zinc-400 line-through">
                        ${Number(pago.monto).toLocaleString('es-AR')}
                      </p>
                      <Badge variant="outline" className="border-zinc-600 text-zinc-400">
                        {pago.estado.toLowerCase()}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
