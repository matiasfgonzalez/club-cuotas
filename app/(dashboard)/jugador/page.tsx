// Dashboard principal del jugador
// Muestra cuotas pendientes y estado de pagos

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
  CreditCard,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Calendar,
  Receipt,
} from 'lucide-react'
import { format, isPast } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function PaginaJugadorDashboard() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/iniciar-sesion')
  }

  // Obtener datos del jugador
  const usuario = await db.usuario.findUnique({
    where: { id: userId },
    include: {
      jugador: true,
    },
  })

  // Si no tiene jugador asociado, redirigir a la página de bienvenida
  if (!usuario?.jugador) {
    redirect('/jugador/bienvenida')
  }

  // Obtener cuotas asignadas al jugador
  const cuotasJugador = await db.cuotaJugador.findMany({
    where: { jugadorId: usuario.jugador.id },
    include: {
      cuota: {
        include: { torneo: true },
      },
      pagos: {
        orderBy: { fechaPago: 'desc' },
      },
    },
    orderBy: { cuota: { fechaVencimiento: 'asc' } },
  })

  const cuotasPendientes = cuotasJugador.filter(
    (cj) => cj.estadoPago === 'PENDIENTE' || cj.estadoPago === 'PARCIAL'
  )
  
  const cuotasPagadas = cuotasJugador.filter(
    (cj) => cj.estadoPago === 'PAGADO'
  )

  const cuotasVencidas = cuotasPendientes.filter((cj) =>
    isPast(cj.cuota.fechaVencimiento)
  )

  // Obtener configuración bancaria activa
  const datosBancarios = await db.configuracionBancaria.findFirst({
    where: { activo: true },
  })

  return (
    <div className="space-y-8">
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-white">Mis Cuotas</h1>
        <p className="text-zinc-400 mt-1">
          Bienvenido, {usuario.nombreCompleto}
        </p>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Pendientes
            </CardTitle>
            <Clock className="h-5 w-5 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {cuotasPendientes.length}
            </div>
            <p className="text-xs text-zinc-500 mt-1">cuotas por pagar</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Vencidas
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {cuotasVencidas.length}
            </div>
            <p className="text-xs text-zinc-500 mt-1">requieren atención</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Pagadas
            </CardTitle>
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {cuotasPagadas.length}
            </div>
            <p className="text-xs text-zinc-500 mt-1">al día</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerta de cuotas vencidas */}
      {cuotasVencidas.length > 0 && (
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">¡Cuotas vencidas!</h3>
              <p className="text-sm text-zinc-400">
                Tienes {cuotasVencidas.length} cuota
                {cuotasVencidas.length > 1 ? 's' : ''} con fecha de vencimiento
                pasada
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <Link href="/jugador/pagos">
                Pagar ahora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lista de cuotas pendientes */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Cuotas pendientes</CardTitle>
            <CardDescription>
              Cuotas asignadas que aún no están pagadas
            </CardDescription>
          </div>
          <Button
            asChild
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <Link href="/jugador/pagos">
              <Receipt className="mr-2 h-4 w-4" />
              Registrar pago
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {cuotasPendientes.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
              <h3 className="font-semibold text-white mb-2">
                ¡Estás al día!
              </h3>
              <p className="text-zinc-500 text-sm">
                No tienes cuotas pendientes de pago
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cuotasPendientes.map((cj) => {
                const vencida = isPast(cj.cuota.fechaVencimiento)
                const montoPagado = cj.pagos
                  .filter((p) => p.estado === 'APROBADO')
                  .reduce((sum, p) => sum + p.monto.toNumber(), 0)
                const montoTotal =
                  cj.montoPersonalizado?.toNumber() ||
                  cj.cuota.monto.toNumber()
                const montoPendiente = montoTotal - montoPagado

                return (
                  <div
                    key={cj.id}
                    className={`p-4 rounded-xl border ${
                      vencida
                        ? 'border-red-500/30 bg-red-500/5'
                        : 'border-zinc-700 bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-white">
                            {cj.cuota.nombre}
                          </h4>
                          {vencida && (
                            <Badge
                              variant="outline"
                              className="border-red-500/30 text-red-400"
                            >
                              Vencida
                            </Badge>
                          )}
                          {cj.estadoPago === 'PARCIAL' && (
                            <Badge
                              variant="outline"
                              className="border-amber-500/30 text-amber-400"
                            >
                              Parcial
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-zinc-500">
                          {cj.cuota.torneo.nombre}
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-zinc-400">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Vence:{' '}
                            {format(cj.cuota.fechaVencimiento, "d 'de' MMMM", {
                              locale: es,
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p
                            className={`text-lg font-bold ${
                              vencida ? 'text-red-400' : 'text-white'
                            }`}
                          >
                            ${montoPendiente.toLocaleString('es-AR')}
                          </p>
                          {montoPagado > 0 && (
                            <p className="text-xs text-zinc-500">
                              Pagado: ${montoPagado.toLocaleString('es-AR')}
                            </p>
                          )}
                        </div>
                        <Button
                          asChild
                          size="sm"
                          variant={vencida ? 'destructive' : 'default'}
                          className={
                            vencida
                              ? ''
                              : 'bg-emerald-500 hover:bg-emerald-600'
                          }
                        >
                          <Link href={`/jugador/pagos?cuota=${cj.id}`}>
                            Pagar
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Datos bancarios */}
      {datosBancarios && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-400" />
              Datos para transferencia
            </CardTitle>
            <CardDescription>
              Utiliza estos datos para realizar tu pago
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Banco</p>
                <p className="text-white font-medium">{datosBancarios.banco}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Titular</p>
                <p className="text-white font-medium">
                  {datosBancarios.titular}
                </p>
              </div>
              {datosBancarios.cbu && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">CBU</p>
                  <p className="text-white font-mono text-sm">
                    {datosBancarios.cbu}
                  </p>
                </div>
              )}
              {datosBancarios.alias && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Alias</p>
                  <p className="text-white font-medium">
                    {datosBancarios.alias}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
