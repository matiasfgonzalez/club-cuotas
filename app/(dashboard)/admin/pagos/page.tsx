// Página de aprobación de pagos
// Lista de pagos pendientes para aprobar o rechazar

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Clock, CheckCircle2, XCircle, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { BotonAprobacion } from '@/components/forms/boton-aprobacion'
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

  const [pagosPendientes, pagosAprobados, pagosRechazados, torneosActivos] = await Promise.all([
    db.pago.findMany({
      where: { estado: 'PENDIENTE' },
      include: {
        jugador: true,
        cuotaJugador: { include: { cuota: { include: { torneo: true } } } },
      },
      orderBy: { fechaPago: 'desc' },
    }),
    db.pago.findMany({
      where: { estado: 'APROBADO' },
      take: 50,
      include: {
        jugador: true,
        cuotaJugador: { include: { cuota: { include: { torneo: true } } } },
        aprobadoPor: true,
      },
      orderBy: { fechaAprobacion: 'desc' },
    }),
    db.pago.findMany({
      where: { estado: 'RECHAZADO' },
      take: 50,
      include: {
        jugador: true,
        cuotaJugador: { include: { cuota: { include: { torneo: true } } } },
        aprobadoPor: true,
      },
      orderBy: { fechaAprobacion: 'desc' },
    }),
    // Obtener torneos activos para el diálogo de pago manual
    db.torneo.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    }),
  ])

  return (
    <div className="space-y-8">
      {/* Título y acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Pagos</h1>
          <p className="text-zinc-400 mt-1">
            Revisa y aprueba los pagos registrados por los jugadores
          </p>
        </div>
        <RegistrarPagoDialog torneos={torneosActivos} />
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
                {pagosPendientes.length}
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
                {pagosAprobados.length}
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
                {pagosRechazados.length}
              </p>
              <p className="text-sm text-zinc-400">Rechazados (últimos)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de pagos */}
      <Tabs defaultValue="pendientes" className="space-y-4">
        <TabsList className="bg-zinc-800 border-zinc-700">
          <TabsTrigger
            value="pendientes"
            className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400"
          >
            <Clock className="mr-2 h-4 w-4" />
            Pendientes ({pagosPendientes.length})
          </TabsTrigger>
          <TabsTrigger
            value="aprobados"
            className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Aprobados
          </TabsTrigger>
          <TabsTrigger
            value="rechazados"
            className="data-[state=active]:bg-red-500/10 data-[state=active]:text-red-400"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Rechazados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendientes" className="space-y-4">
          {pagosPendientes.length === 0 ? (
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
            pagosPendientes.map((pago) => (
              <Card key={pago.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Info del pago */}
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-lg">
                          {pago.jugador.nombre.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-white">
                          {pago.jugador.nombre}
                        </h4>
                        <p className="text-sm text-zinc-400">
                          {pago.cuotaJugador.cuota.nombre} •{' '}
                          {pago.cuotaJugador.cuota.torneo.nombre}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <span>
                            {format(pago.fechaPago, "d 'de' MMMM, HH:mm", {
                              locale: es,
                            })}
                          </span>
                          <Badge variant="outline" className="border-zinc-600 text-zinc-400">
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
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">
                          ${pago.monto.toNumber().toLocaleString('es-AR')}
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
          {pagosAprobados.length === 0 ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-8 text-center">
                <p className="text-zinc-500">No hay pagos aprobados aún</p>
              </CardContent>
            </Card>
          ) : (
            pagosAprobados.map((pago) => (
              <Card key={pago.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-emerald-500/20 text-emerald-400">
                          {pago.jugador.nombre.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white">
                          {pago.jugador.nombre}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {pago.cuotaJugador.cuota.nombre}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">
                        ${pago.monto.toNumber().toLocaleString('es-AR')}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Aprobado por {pago.aprobadoPor?.nombreCompleto}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="rechazados" className="space-y-4">
          {pagosRechazados.length === 0 ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-8 text-center">
                <p className="text-zinc-500">No hay pagos rechazados</p>
              </CardContent>
            </Card>
          ) : (
            pagosRechazados.map((pago) => (
              <Card key={pago.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-red-500/20 text-red-400">
                          {pago.jugador.nombre.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white">
                          {pago.jugador.nombre}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {pago.cuotaJugador.cuota.nombre}
                        </p>
                        {pago.notas && (
                          <p className="text-xs text-red-400 mt-1">
                            Motivo: {pago.notas}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">
                        ${pago.monto.toNumber().toLocaleString('es-AR')}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Rechazado por {pago.aprobadoPor?.nombreCompleto}
                      </p>
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
