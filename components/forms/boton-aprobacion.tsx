// Componente de botones de aprobación de pagos
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
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { procesarPago } from '@/lib/actions/pagos'
import { toast } from 'sonner'

interface BotonAprobacionProps {
  pagoId: string
}

export function BotonAprobacion({ pagoId }: BotonAprobacionProps) {
  const [dialogoAbierto, setDialogoAbierto] = useState<
    'aprobar' | 'rechazar' | null
  >(null)
  const [notas, setNotas] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleProcesar(estado: 'APROBADO' | 'RECHAZADO') {
    setCargando(true)
    try {
      const resultado = await procesarPago({
        pagoId,
        estado,
        notas: notas || undefined,
      })

      if (resultado.exito) {
        toast.success(resultado.mensaje)
        setDialogoAbierto(null)
        setNotas('')
      } else {
        toast.error(resultado.error)
      }
    } catch {
      toast.error('Error al procesar el pago')
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <div className="flex gap-2 flex-col sm:flex-row">
        <Button
          onClick={() => setDialogoAbierto('aprobar')}
          className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm"
          size="sm"
        >
          <CheckCircle2 className="mr-1 sm:mr-2 h-4 w-4" />
          Aprobar
        </Button>
        <Button
          onClick={() => setDialogoAbierto('rechazar')}
          variant="outline"
          className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs sm:text-sm"
          size="sm"
        >
          <XCircle className="mr-1 sm:mr-2 h-4 w-4" />
          Rechazar
        </Button>
      </div>

      {/* Diálogo de aprobación */}
      <AlertDialog
        open={dialogoAbierto === 'aprobar'}
        onOpenChange={() => setDialogoAbierto(null)}
      >
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              ¿Aprobar este pago?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              El pago será marcado como aprobado y la cuota del jugador se
              actualizará.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label htmlFor="notas-aprobar" className="text-zinc-300">
              Notas (opcional)
            </Label>
            <Textarea
              id="notas-aprobar"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Agregar una nota..."
              className="mt-2 bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleProcesar('APROBADO')}
              disabled={cargando}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {cargando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar aprobación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de rechazo */}
      <AlertDialog
        open={dialogoAbierto === 'rechazar'}
        onOpenChange={() => setDialogoAbierto(null)}
      >
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              ¿Rechazar este pago?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              El pago será marcado como rechazado. Es recomendable indicar el
              motivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label htmlFor="notas-rechazar" className="text-zinc-300">
              Motivo del rechazo
            </Label>
            <Textarea
              id="notas-rechazar"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Indicar el motivo del rechazo..."
              className="mt-2 bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleProcesar('RECHAZADO')}
              disabled={cargando}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {cargando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar rechazo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
