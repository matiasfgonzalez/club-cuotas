// Página de gestión de torneos
// Lista y CRUD de torneos

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
import { Plus, Trophy, Calendar, Users, Edit, MoreVertical } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default async function PaginaTorneos() {
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

  const torneos = await db.torneo.findMany({
    orderBy: { fechaInicio: 'desc' },
    include: {
      _count: {
        select: {
          inscripciones: true,
          cuotas: true,
        },
      },
    },
  })

  return (
    <div className="space-y-8">
      {/* Título y acción */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Torneos</h1>
          <p className="text-zinc-400 mt-1">
            Gestiona torneos y competencias del equipo
          </p>
        </div>
        <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <Link href="/admin/torneos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Torneo
          </Link>
        </Button>
      </div>

      {/* Lista de torneos */}
      {torneos.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="h-12 w-12 text-zinc-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No hay torneos
            </h3>
            <p className="text-zinc-500 text-sm mb-4 text-center">
              Crea tu primer torneo para comenzar a gestionar cuotas
            </p>
            <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <Link href="/admin/torneos/nuevo">
                <Plus className="mr-2 h-4 w-4" />
                Crear torneo
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {torneos.map((torneo) => (
            <Card
              key={torneo.id}
              className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg">
                        {torneo.nombre}
                      </CardTitle>
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
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-zinc-400">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
                      <DropdownMenuItem asChild className="text-zinc-300 focus:bg-zinc-700">
                        <Link href={`/admin/torneos/${torneo.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {torneo.descripcion && (
                  <CardDescription className="text-zinc-400 line-clamp-2">
                    {torneo.descripcion}
                  </CardDescription>
                )}
                <div className="flex items-center gap-4 text-sm text-zinc-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(torneo.fechaInicio, 'MMM yyyy', { locale: es })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{torneo._count.inscripciones} jugadores</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500">
                    {torneo._count.cuotas} cuotas configuradas
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
