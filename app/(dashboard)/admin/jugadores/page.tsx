// Página de gestión de jugadores
// Lista y CRUD de jugadores

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
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
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Plus, Users, Search, Phone, UserCheck, UserX } from 'lucide-react'

export default async function PaginaJugadores() {
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

  const jugadores = await db.jugador.findMany({
    orderBy: { creadoEn: 'desc' },
    include: {
      usuarios: {
        select: {
          id: true,
          email: true,
          nombreCompleto: true,
        },
      },
      inscripciones: {
        include: { torneo: true },
        where: { activo: true },
      },
      cuotasAsignadas: {
        where: { estadoPago: { in: ['PENDIENTE', 'PARCIAL'] } },
        include: {
          cuota: {
            include: {
              torneo: true,
            },
          },
        },
      },
    },
  })

  const configuracionBancaria = await db.configuracionBancaria.findFirst({
    where: { activo: true },
  })

  return (
    <div className="space-y-8">
      {/* Título y acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Jugadores</h1>
          <p className="text-zinc-400 mt-1">
            {jugadores.length} jugadores registrados
          </p>
        </div>
        <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <Link href="/admin/jugadores/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Jugador
          </Link>
        </Button>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Buscar jugador por nombre o CUIT..."
          className="pl-10 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
        />
      </div>

      {/* Lista de jugadores */}
      {jugadores.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-zinc-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No hay jugadores
            </h3>
            <p className="text-zinc-500 text-sm mb-4 text-center">
              Agrega jugadores para empezar a asignarles cuotas
            </p>
            <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <Link href="/admin/jugadores/nuevo">
                <Plus className="mr-2 h-4 w-4" />
                Agregar jugador
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-zinc-900 border-zinc-800">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Jugador</TableHead>
                <TableHead className="text-zinc-400">Contacto</TableHead>
                <TableHead className="text-zinc-400">Torneos</TableHead>
                <TableHead className="text-zinc-400">Cuotas Pendientes</TableHead>
                <TableHead className="text-zinc-400">Usuarios</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jugadores.map((jugador) => (
                <TableRow
                  key={jugador.id}
                  className="border-zinc-800 hover:bg-zinc-800/50"
                >
                  <TableCell>
                    <Link
                      href={`/admin/jugadores/${jugador.id}`}
                      className="flex items-center gap-3 hover:opacity-80"
                    >
                      <Avatar className="h-10 w-10 bg-zinc-700">
                        <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                          {jugador.nombre.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white">
                          {jugador.nombre}
                        </p>
                        {jugador.posicion && (
                          <p className="text-xs text-zinc-500">
                            {jugador.posicion}
                            {jugador.numeroCamiseta && ` • #${jugador.numeroCamiseta}`}
                          </p>
                        )}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {jugador.cuit && (
                        <p className="text-sm text-zinc-400">
                          CUIT: {jugador.cuit}
                        </p>
                      )}
                      {jugador.telefono && (
                        <div className="flex items-center gap-1 text-sm text-zinc-500">
                          <Phone className="h-3 w-3" />
                          <span>{jugador.telefono}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {jugador.inscripciones.length === 0 ? (
                        <span className="text-sm text-zinc-500">Sin torneos</span>
                      ) : (
                        jugador.inscripciones.slice(0, 2).map((insc) => (
                          <Badge
                            key={insc.id}
                            variant="outline"
                            className="border-zinc-600 text-zinc-400 text-xs"
                          >
                            {insc.torneo.nombre}
                          </Badge>
                        ))
                      )}
                      {jugador.inscripciones.length > 2 && (
                        <Badge
                          variant="outline"
                          className="border-zinc-600 text-zinc-400 text-xs"
                        >
                          +{jugador.inscripciones.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {jugador.cuotasAsignadas.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        <Badge
                          variant="outline"
                          className="border-amber-500/30 text-amber-400 w-fit"
                        >
                          {jugador.cuotasAsignadas.length} pendiente
                          {jugador.cuotasAsignadas.length > 1 ? 's' : ''}
                        </Badge>
                        {jugador.telefono && (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20 h-8 text-xs w-fit"
                          >
                            <a
                              href={`https://wa.me/${jugador.telefono.replace(
                                /\D/g,
                                ''
                              )}?text=${encodeURIComponent(
                                `Hola ${jugador.nombre}, te recordamos que tienes las siguientes cuotas pendientes:\n\n${jugador.cuotasAsignadas
                                  .map(
                                    (c) =>
                                      `• ${c.cuota.nombre} - $${c.cuota.monto} (${c.cuota.torneo?.nombre || 'Torneo'})`
                                  )
                                  .join('\n')}\n\n${
                                  configuracionBancaria
                                    ? `Datos para transferir:\nBanco: ${configuracionBancaria.banco}\nAlias: ${configuracionBancaria.alias}\nCBU: ${configuracionBancaria.cbu}\nTitular: ${configuracionBancaria.titular}`
                                    : ''
                                }\n\nPor favor, envíanos el comprobante cuando realices el pago.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Phone className="mr-2 h-3 w-3" />
                              Reclamar
                            </a>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/30 text-emerald-400"
                      >
                        Al día
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {jugador.usuarios.length > 0 ? (
                      <div className="flex items-center gap-1">
                        <UserCheck className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm text-emerald-400">
                          {jugador.usuarios.length} asociado{jugador.usuarios.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <UserX className="h-4 w-4 text-zinc-500" />
                        <span className="text-sm text-zinc-500">Sin usuario</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
