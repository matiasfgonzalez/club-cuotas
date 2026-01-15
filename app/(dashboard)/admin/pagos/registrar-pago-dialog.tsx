'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus, CreditCard, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

interface TorneoSimple {
  id: string
  nombre: string
}

interface CuotaSimple {
  id: string
  nombre: string
  monto: number
  tipo: string
}

interface JugadorDeudor {
  id: string
  cuotaJugadorId: string
  nombre: string
  dni: string | null
  saldoPendiente: number
}

interface RegistrarPagoDialogProps {
  torneos: TorneoSimple[]
}

export function RegistrarPagoDialog({ torneos }: RegistrarPagoDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)

  // Estados de selección
  const [torneoId, setTorneoId] = useState('')
  const [cuotaId, setCuotaId] = useState('')
  const [jugadorId, setJugadorId] = useState('')
  
  // Datos cargados dinámicamente
  const [cuotas, setCuotas] = useState<CuotaSimple[]>([])
  const [jugadores, setJugadores] = useState<JugadorDeudor[]>([])
  const [selectedJugador, setSelectedJugador] = useState<JugadorDeudor | null>(null)

  // Datos del formulario
  const [monto, setMonto] = useState('')
  const [metodo, setMetodo] = useState('EFECTIVO')
  const [comprobante, setComprobante] = useState('')
  const [notas, setNotas] = useState('')

  // Cargar cuotas cuando cambia el torneo
  useEffect(() => {
    if (!torneoId) {
      setCuotas([])
      return
    }

    const fetchCuotas = async () => {
      setLoadingData(true)
      try {
        const res = await fetch(`/api/admin/pagos/registrar?tipo=cuotas&id=${torneoId}`)
        if (!res.ok) throw new Error('Error al cargar cuotas')
        const data = await res.json()
        setCuotas(data)
      } catch (error) {
        console.error(error)
        toast.error('No se pudieron cargar las cuotas')
      } finally {
        setLoadingData(false)
      }
    }

    fetchCuotas()
    setCuotaId('')
    setJugadores([])
    setSelectedJugador(null)
  }, [torneoId])

  // Cargar jugadores cuando cambia la cuota
  useEffect(() => {
    if (!cuotaId) {
      setJugadores([])
      return
    }

    const fetchJugadores = async () => {
      setLoadingData(true)
      try {
        const res = await fetch(`/api/admin/pagos/registrar?tipo=jugadores&id=${cuotaId}`)
        if (!res.ok) throw new Error('Error al cargar jugadores')
        const data = await res.json()
        setJugadores(data)
      } catch (error) {
        console.error(error)
        toast.error('No se pudieron cargar los jugadores')
      } finally {
        setLoadingData(false)
      }
    }

    fetchJugadores()
    setJugadorId('')
    setSelectedJugador(null)
  }, [cuotaId])

  // Actualizar jugador seleccionado y monto predeterminado
  useEffect(() => {
    if (!jugadorId) {
      setSelectedJugador(null)
      return
    }
    const jugador = jugadores.find(j => j.id === jugadorId) || null
    setSelectedJugador(jugador)
    if (jugador) {
        setMonto(jugador.saldoPendiente.toString())
    } else {
        setMonto('')
    }
  }, [jugadorId, jugadores])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedJugador) return

    setLoading(true)
    try {
      const res = await fetch('/api/admin/pagos/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuotaJugadorId: selectedJugador.cuotaJugadorId,
          jugadorId: selectedJugador.id,
          monto: parseFloat(monto),
          metodo,
          comprobante,
          notas,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al registrar pago')
      }

      toast.success('Pago registrado y aprobado correctamente')
      router.refresh()
      setOpen(false)
      
      // Resetear formulario
      setTorneoId('')
      setCuotaId('')
      setJugadorId('')
      setMonto('')
      setNotas('')
      
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2">
          <CreditCard className="h-4 w-4" />
          Registrar Pago
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Pago Manual</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Registra un pago realizado fuera de la plataforma (Efectivo/Transferencia).
            Se marcará como APROBADO automáticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          
          {/* Selector de Torneo */}
          <div className="space-y-2">
            <Label>Torneo</Label>
            <Select value={torneoId} onValueChange={setTorneoId}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Selecciona un torneo" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {torneos.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selector de Cuota */}
          <div className="space-y-2">
            <Label>Cuota</Label>
            <Select value={cuotaId} onValueChange={setCuotaId} disabled={!torneoId || loadingData}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue placeholder={loadingData ? "Cargando..." : "Selecciona una cuota"} />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {cuotas.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre} (${c.monto.toLocaleString('es-AR')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selector de Jugador */}
          <div className="space-y-2">
            <Label>Jugador (Solo pendientes)</Label>
            <Select value={jugadorId} onValueChange={setJugadorId} disabled={!cuotaId || loadingData}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue placeholder={
                    loadingData 
                    ? "Cargando..." 
                    : jugadores.length === 0 
                        ? "No hay jugadores con deuda"
                        : "Selecciona un jugador"
                } />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {jugadores.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.nombre} (Debe: ${j.saldoPendiente.toLocaleString('es-AR')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedJugador && (
            <>
              <div className="space-y-2">
                <Label htmlFor="monto">Monto a pagar</Label>
                <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                    id="monto"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pl-10 bg-zinc-800 border-zinc-700"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    required
                    />
                </div>
                <p className="text-xs text-zinc-500">
                    Saldo total: ${selectedJugador.saldoPendiente.toLocaleString('es-AR')}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Método de Pago</Label>
                <Select value={metodo} onValueChange={setMetodo}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                    <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                    <SelectItem value="MERCADOPAGO">Mercado Pago</SelectItem>
                    <SelectItem value="OTRO">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Observaciones (Opcional)</Label>
                <Textarea
                  id="notas"
                  placeholder="Detalles adicionales..."
                  className="bg-zinc-800 border-zinc-700 resize-none"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                />
              </div>
            </>
          )}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="hover:bg-zinc-800"
            >
              Cancelar
            </Button>
            <Button 
                type="submit" 
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                disabled={loading || !selectedJugador}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Pago
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
