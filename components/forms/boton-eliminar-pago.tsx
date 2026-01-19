// Componente de botón para eliminar pagos
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { eliminarPago } from '@/lib/actions/pagos'
import { toast } from 'sonner'

interface BotonEliminarPagoProps {
  pagoId: string
  nombreJugador?: string
  nombreCuota?: string
}

export function BotonEliminarPago({ 
  pagoId, 
  nombreJugador = 'este jugador',
  nombreCuota = 'esta cuota'
}: BotonEliminarPagoProps) {
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  async function handleEliminar() {
    if (motivo.length < 10) {
      setError('El motivo debe tener al menos 10 caracteres')
      return
    }
    
    setError('')
    setCargando(true)
    
    try {
      const resultado = await eliminarPago({
        pagoId,
        motivo,
      })

      if (resultado.exito) {
        toast.success(resultado.mensaje)
        setDialogoAbierto(false)
        setMotivo('')
      } else {
        toast.error(resultado.error)
      }
    } catch {
      toast.error('Error al eliminar el pago')
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setDialogoAbierto(true)}
        variant="outline"
        size="sm"
        className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs sm:text-sm"
      >
        <Trash2 className="mr-1 sm:mr-2 h-4 w-4" />
        Eliminar
      </Button>

      <AlertDialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              ¿Eliminar este pago?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Vas a eliminar el pago de <span className="text-white font-medium">{nombreJugador}</span> para{' '}
              <span className="text-white font-medium">{nombreCuota}</span>.
              <br /><br />
              Esta acción marcará el pago como eliminado y recalculará el estado de la cuota del jugador.
              El motivo de eliminación es obligatorio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4 space-y-2">
            <Label htmlFor="motivo-eliminar" className="text-zinc-300">
              Motivo de eliminación <span className="text-red-400">*</span>
            </Label>
            <Textarea
              id="motivo-eliminar"
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value)
                if (e.target.value.length >= 10) {
                  setError('')
                }
              }}
              placeholder="Indicar el motivo de la eliminación (mínimo 10 caracteres)..."
              className="mt-2 bg-zinc-800 border-zinc-700 text-white min-h-[100px]"
            />
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <p className="text-xs text-zinc-500">
              {motivo.length}/10 caracteres mínimos
            </p>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              onClick={() => {
                setMotivo('')
                setError('')
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleEliminar()
              }}
              disabled={cargando || motivo.length < 10}
              className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
            >
              {cargando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar eliminación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
