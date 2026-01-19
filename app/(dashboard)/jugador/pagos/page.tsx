// Página para registrar pago (jugador)
// Formulario para subir comprobante y registrar pago

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
import { Receipt, CreditCard, Calendar } from 'lucide-react'
import { format, isPast } from 'date-fns'
import { es } from 'date-fns/locale'
import { FormularioPago } from '@/components/forms/formulario-pago'

export default async function PaginaRegistrarPago({
  searchParams,
}: {
  searchParams: Promise<{ cuota?: string }>
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/iniciar-sesion')
  }

  const usuario = await db.usuario.findUnique({
    where: { id: userId },
    include: { jugador: true },
  })

  if (!usuario?.jugador) {
    redirect('/jugador')
  }

  // Obtener cuotas pendientes del jugador
  const cuotasPendientes = await db.cuotaJugador.findMany({
    where: {
      jugadorId: usuario.jugador.id,
      estadoPago: { in: ['PENDIENTE', 'PARCIAL'] },
    },
    include: {
      cuota: { include: { torneo: true } },
      pagos: { where: { estado: 'APROBADO', eliminado: false } },
    },
    orderBy: { cuota: { fechaVencimiento: 'asc' } },
  })

  // Obtener datos bancarios
  const datosBancarios = await db.configuracionBancaria.findFirst({
    where: { activo: true },
  })

  // Calcular montos pendientes
  const cuotasConMontos = cuotasPendientes.map((cj) => {
    const montoPagado = cj.pagos.reduce((sum, p) => sum + p.monto.toNumber(), 0)
    const montoTotal = cj.montoPersonalizado?.toNumber() || cj.cuota.monto.toNumber()
    const montoPendiente = montoTotal - montoPagado
    const vencida = isPast(cj.cuota.fechaVencimiento)

    return {
      ...cj,
      montoPagado,
      montoTotal,
      montoPendiente,
      vencida,
    }
  })

  const params = await searchParams
  const cuotaSeleccionada = params.cuota

  return (
    <div className="space-y-8">
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-white">Registrar Pago</h1>
        <p className="text-zinc-400 mt-1">
          Selecciona una cuota y registra tu pago
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulario de pago */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-400" />
              Nuevo Pago
            </CardTitle>
            <CardDescription>
              Completa los datos del pago realizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cuotasConMontos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-zinc-500">
                  No tienes cuotas pendientes de pago
                </p>
              </div>
            ) : (
              <FormularioPago
                cuotasPendientes={cuotasConMontos.map((cj) => ({
                  id: cj.id,
                  nombre: cj.cuota.nombre,
                  torneo: cj.cuota.torneo.nombre,
                  montoPendiente: cj.montoPendiente,
                  fechaVencimiento: cj.cuota.fechaVencimiento,
                  vencida: cj.vencida,
                }))}
                cuotaSeleccionada={cuotaSeleccionada}
              />
            )}
          </CardContent>
        </Card>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Datos bancarios */}
          {datosBancarios && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-400" />
                  Datos para transferencia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Banco</p>
                    <p className="text-white font-medium">
                      {datosBancarios.banco}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Tipo de cuenta</p>
                    <p className="text-white font-medium">
                      {datosBancarios.tipoCuenta}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Titular</p>
                    <p className="text-white font-medium">
                      {datosBancarios.titular}
                    </p>
                  </div>
                  {datosBancarios.cbu && (
                    <div className="sm:col-span-2">
                      <p className="text-xs text-zinc-500 mb-1">CBU</p>
                      <p className="text-white font-mono text-sm bg-zinc-800 p-2 rounded">
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

          {/* Cuotas pendientes */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-400" />
                Tus cuotas pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cuotasConMontos.map((cj) => (
                  <div
                    key={cj.id}
                    className={`p-3 rounded-lg border ${
                      cj.vencida
                        ? 'border-red-500/30 bg-red-500/5'
                        : 'border-zinc-700 bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-white text-sm">
                          {cj.cuota.nombre}
                        </h4>
                        <p className="text-xs text-zinc-500">
                          {cj.cuota.torneo.nombre}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          Vence:{' '}
                          {format(cj.cuota.fechaVencimiento, "d 'de' MMMM", {
                            locale: es,
                          })}
                        </p>
                      </div>
                      <p
                        className={`font-bold ${
                          cj.vencida ? 'text-red-400' : 'text-white'
                        }`}
                      >
                        ${cj.montoPendiente.toLocaleString('es-AR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
