'use client'

// Formulario para solicitar asociación de jugador por CUIT

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Search, CheckCircle2 } from 'lucide-react'

export function SolicitudAsociacionForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [cuit, setCuit] = useState('')
  const [jugadorEncontrado, setJugadorEncontrado] = useState<{
    id: string
    nombre: string
  } | null>(null)

  const buscarJugador = async () => {
    if (!cuit.trim()) {
      toast.error('Ingresa un CUIT')
      return
    }

    setIsLoading(true)
    setJugadorEncontrado(null)

    try {
      const response = await fetch(`/api/jugador/buscar-por-cuit?cuit=${encodeURIComponent(cuit.trim())}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Jugador no encontrado')
      }

      const jugador = await response.json()
      setJugadorEncontrado(jugador)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al buscar')
    } finally {
      setIsLoading(false)
    }
  }

  const solicitarAsociacion = async () => {
    if (!jugadorEncontrado) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/jugador/solicitar-asociacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jugadorId: jugadorEncontrado.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al asociar')
      }

      toast.success('¡Asociación exitosa!')
      router.push('/jugador')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al asociar')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cuit" className="text-zinc-300">
          CUIT
        </Label>
        <div className="flex gap-2">
          <Input
            id="cuit"
            value={cuit}
            onChange={(e) => {
              setCuit(e.target.value)
              setJugadorEncontrado(null)
            }}
            placeholder="20-12345678-9"
            className="bg-zinc-800 border-zinc-700 text-white flex-1"
            disabled={isLoading}
          />
          <Button
            type="button"
            onClick={buscarJugador}
            disabled={isLoading || !cuit.trim()}
            className="bg-zinc-700 hover:bg-zinc-600"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {jugadorEncontrado && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <div className="flex-1">
              <p className="font-medium text-white">{jugadorEncontrado.nombre}</p>
              <p className="text-sm text-zinc-400">Jugador encontrado</p>
            </div>
          </div>
          <Button
            onClick={solicitarAsociacion}
            disabled={isLoading}
            className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Asociar a mi cuenta
          </Button>
        </div>
      )}
    </div>
  )
}
