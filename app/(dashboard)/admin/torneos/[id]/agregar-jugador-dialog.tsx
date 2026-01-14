'use client'

// Diálogo para agregar jugadores a un torneo

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { UserPlus, Loader2, Search, Users } from 'lucide-react'

interface Jugador {
  id: string
  nombre: string
  email: string
}

interface AgregarJugadorDialogProps {
  torneoId: string
  torneoNombre: string
  jugadoresDisponibles: Jugador[]
}

export function AgregarJugadorDialog({
  torneoId,
  torneoNombre,
  jugadoresDisponibles,
}: AgregarJugadorDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  const jugadoresFiltrados = jugadoresDisponibles.filter(
    (j) =>
      j.nombre.toLowerCase().includes(search.toLowerCase()) ||
      j.email.toLowerCase().includes(search.toLowerCase())
  )

  const toggleJugador = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (selected.length === 0) {
      toast.error('Selecciona al menos un jugador')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/inscripciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          torneoId,
          jugadorIds: selected,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al inscribir jugadores')
      }

      toast.success(`${selected.length} jugador(es) inscrito(s) correctamente`)
      setOpen(false)
      setSelected([])
      setSearch('')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al inscribir')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <UserPlus className="mr-2 h-4 w-4" />
          Agregar jugadores
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Agregar jugadores</DialogTitle>
          <DialogDescription>
            Selecciona los jugadores a inscribir en {torneoNombre}
          </DialogDescription>
        </DialogHeader>

        {jugadoresDisponibles.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">
              Todos los jugadores ya están inscritos en este torneo
            </p>
          </div>
        ) : (
          <>
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Buscar jugador..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            {/* Lista de jugadores */}
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {jugadoresFiltrados.length === 0 ? (
                <p className="text-zinc-500 text-center py-4">
                  No se encontraron jugadores
                </p>
              ) : (
                jugadoresFiltrados.map((jugador) => (
                  <div
                    key={jugador.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selected.includes(jugador.id)
                        ? 'bg-emerald-500/10 border border-emerald-500/30'
                        : 'bg-zinc-800/50 border border-transparent hover:bg-zinc-800'
                    }`}
                    onClick={() => toggleJugador(jugador.id)}
                  >
                    <Checkbox
                      checked={selected.includes(jugador.id)}
                      onCheckedChange={() => toggleJugador(jugador.id)}
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium">{jugador.nombre}</p>
                      <p className="text-sm text-zinc-500">{jugador.email}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Botones */}
            <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
              <p className="text-sm text-zinc-500">
                {selected.length} seleccionado(s)
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="border-zinc-700"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || selected.length === 0}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Inscribir
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
