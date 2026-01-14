// Página de historial de pagos del jugador

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
import { Badge } from '@/components/ui/badge'
import { History, CheckCircle2, Clock, XCircle, Receipt } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function PaginaHistorial() {
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

  const pagos = await db.pago.findMany({
    where: { jugadorId: usuario.jugador.id },
    include: {
      cuotaJugador: {
        include: {
          cuota: { include: { torneo: true } },
        },
      },
    },
    orderBy: { fechaPago: 'desc' },
  })

  // Calcular totales
  const totalPagado = pagos
    .filter((p) => p.estado === 'APROBADO')
    .reduce((sum, p) => sum + p.monto.toNumber(), 0)

  const totalPendiente = pagos
    .filter((p) => p.estado === 'PENDIENTE')
    .reduce((sum, p) => sum + p.monto.toNumber(), 0)

  return (
    <div className="space-y-8">
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-white">Historial de Pagos</h1>
        <p className="text-zinc-400 mt-1">
          Revisa todos tus pagos registrados
        </p>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Total pagado</p>
              <p className="text-2xl font-bold text-white">
                ${totalPagado.toLocaleString('es-AR')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Pendiente de aprobación</p>
              <p className="text-2xl font-bold text-white">
                ${totalPendiente.toLocaleString('es-AR')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de pagos */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <History className="h-5 w-5 text-zinc-400" />
            Todos tus pagos
          </CardTitle>
          <CardDescription>
            {pagos.length} pago{pagos.length !== 1 ? 's' : ''} registrado
            {pagos.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pagos.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="font-semibold text-white mb-2">Sin pagos</h3>
              <p className="text-zinc-500 text-sm">
                Aún no has registrado ningún pago
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pagos.map((pago) => (
                <div
                  key={pago.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-800/30"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        pago.estado === 'APROBADO'
                          ? 'bg-emerald-500/10'
                          : pago.estado === 'RECHAZADO'
                          ? 'bg-red-500/10'
                          : 'bg-amber-500/10'
                      }`}
                    >
                      {pago.estado === 'APROBADO' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : pago.estado === 'RECHAZADO' ? (
                        <XCircle className="h-5 w-5 text-red-400" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-white">
                        {pago.cuotaJugador.cuota.nombre}
                      </h4>
                      <p className="text-sm text-zinc-500">
                        {pago.cuotaJugador.cuota.torneo.nombre}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-zinc-500">
                          {format(pago.fechaPago, "d 'de' MMMM yyyy, HH:mm", {
                            locale: es,
                          })}
                        </span>
                        <Badge
                          variant="outline"
                          className="border-zinc-600 text-zinc-400 text-xs"
                        >
                          {pago.metodo.replace('_', ' ')}
                        </Badge>
                      </div>
                      {pago.estado === 'RECHAZADO' && pago.notas && (
                        <p className="text-xs text-red-400 mt-2">
                          Motivo: {pago.notas}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right sm:text-right ml-14 sm:ml-0">
                    <p className="text-lg font-bold text-white">
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
                      {pago.estado === 'APROBADO'
                        ? 'Aprobado'
                        : pago.estado === 'RECHAZADO'
                        ? 'Rechazado'
                        : 'Pendiente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
