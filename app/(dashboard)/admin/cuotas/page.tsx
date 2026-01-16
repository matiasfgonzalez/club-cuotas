// Página de gestión de cuotas (admin)

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
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
import { Plus, CreditCard, Calendar, Users, AlertTriangle } from 'lucide-react'
import { format, isPast, isFuture } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function PaginaCuotas() {
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

  const cuotas = await db.cuota.findMany({
    orderBy: { fechaVencimiento: 'desc' },
    include: {
      torneo: true,
      asignaciones: {
        include: {
          _count: {
            select: { pagos: { where: { estado: 'APROBADO' } } },
          },
        },
      },
    },
  })

  // Calcular estadísticas por cuota
  const cuotasConEstadisticas = cuotas.map((cuota) => {
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
    const porVencer =
      !vencida &&
      isFuture(cuota.fechaVencimiento) &&
      new Date(cuota.fechaVencimiento).getTime() - Date.now() <
        7 * 24 * 60 * 60 * 1000 // 7 días

    return {
      ...cuota,
      totalAsignaciones,
      pagadasCompleto,
      parciales,
      pendientes,
      vencida,
      porVencer,
    }
  })

  // Mapeo de tipos de cuota
  const tiposCuota: Record<string, string> = {
    UNICA: 'Única',
    MENSUAL: 'Mensual',
    INSCRIPCION: 'Inscripción',
    EXTRAORDINARIA: 'Extraordinaria',
  }

  return (
    <div className="space-y-8 overflow-hidden">
      {/* Título y acción */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-white">Cuotas</h1>
          <p className="text-zinc-400 mt-1">
            Gestiona las cuotas y asignaciones a jugadores
          </p>
        </div>
        <Button
          asChild
          className="bg-emerald-500 hover:bg-emerald-600 text-white w-full sm:w-auto shrink-0"
        >
          <Link href="/admin/cuotas/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cuota
          </Link>
        </Button>
      </div>

      {/* Lista de cuotas */}
      {cuotasConEstadisticas.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-zinc-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No hay cuotas
            </h3>
            <p className="text-zinc-500 text-sm mb-4 text-center">
              Crea una cuota y asígnala a los jugadores
            </p>
            <Button
              asChild
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <Link href="/admin/cuotas/nueva">
                <Plus className="mr-2 h-4 w-4" />
                Crear cuota
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-zinc-900 border-zinc-800">
          <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Cuota</TableHead>
                  <TableHead className="text-zinc-400 hidden sm:table-cell">
                    Torneo
                  </TableHead>
                  <TableHead className="text-zinc-400">Monto</TableHead>
                  <TableHead className="text-zinc-400 hidden md:table-cell">
                    Vencimiento
                  </TableHead>
                  <TableHead className="text-zinc-400 hidden lg:table-cell">
                    Estado
                  </TableHead>
                  <TableHead className="text-zinc-400 text-right">
                    Recaudación
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuotasConEstadisticas.map((cuota) => (
                  <TableRow
                    key={cuota.id}
                    className="border-zinc-800 hover:bg-zinc-800/50"
                  >
                    <TableCell>
                      <Link
                        href={`/admin/cuotas/${cuota.id}`}
                        className="hover:underline"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {cuota.nombre}
                            </p>
                            <Badge
                              variant="outline"
                              className="border-zinc-600 text-zinc-400 text-xs"
                            >
                              {tiposCuota[cuota.tipo]}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-zinc-300">
                        {cuota.torneo.nombre}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-white">
                        ${cuota.monto.toNumber().toLocaleString('es-AR')}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-zinc-500" />
                        <span
                          className={
                            cuota.vencida ? 'text-red-400' : 'text-zinc-300'
                          }
                        >
                          {format(cuota.fechaVencimiento, 'd MMM yyyy', {
                            locale: es,
                          })}
                        </span>
                        {cuota.vencida && (
                          <AlertTriangle className="h-4 w-4 text-red-400" />
                        )}
                        {cuota.porVencer && (
                          <Badge
                            variant="outline"
                            className="border-amber-500/30 text-amber-400 text-xs"
                          >
                            Por vencer
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-zinc-500" />
                        <div className="flex gap-1">
                          <Badge
                            variant="outline"
                            className="border-emerald-500/30 text-emerald-400 text-xs"
                          >
                            {cuota.pagadasCompleto} pagadas
                          </Badge>
                          {cuota.parciales > 0 && (
                            <Badge
                              variant="outline"
                              className="border-amber-500/30 text-amber-400 text-xs"
                            >
                              {cuota.parciales} parcial
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className="border-zinc-600 text-zinc-400 text-xs"
                          >
                            {cuota.pendientes} pendiente
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="text-white font-medium">
                        {cuota.pagadasCompleto}/{cuota.totalAsignaciones}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {cuota.totalAsignaciones > 0
                          ? Math.round(
                              (cuota.pagadasCompleto /
                                cuota.totalAsignaciones) *
                                100,
                            )
                          : 0}
                        % completado
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  )
}
