// Formulario de registro de pago
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { pagoSchema, type PagoFormData } from '@/lib/validations'
import { registrarPago } from '@/lib/actions/pagos'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface CuotaPendiente {
  id: string
  nombre: string
  torneo: string
  montoPendiente: number
  fechaVencimiento: Date
  vencida: boolean
}

interface FormularioPagoProps {
  cuotasPendientes: CuotaPendiente[]
  cuotaSeleccionada?: string
}

const metodosPago = [
  { value: 'TRANSFERENCIA', label: 'Transferencia bancaria' },
  { value: 'MERCADOPAGO', label: 'MercadoPago' },
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'OTRO', label: 'Otro' },
]

export function FormularioPago({
  cuotasPendientes,
  cuotaSeleccionada,
}: FormularioPagoProps) {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)

  const cuotaInicial = cuotasPendientes.find((c) => c.id === cuotaSeleccionada)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PagoFormData>({
    resolver: zodResolver(pagoSchema),
    defaultValues: {
      cuotaJugadorId: cuotaSeleccionada || '',
      monto: cuotaInicial?.montoPendiente || 0,
      metodo: 'TRANSFERENCIA',
      comprobante: '',
      notas: '',
    },
  })

  const cuotaSeleccionadaId = watch('cuotaJugadorId')
  const cuotaActual = cuotasPendientes.find((c) => c.id === cuotaSeleccionadaId)

  async function onSubmit(datos: PagoFormData) {
    setCargando(true)
    try {
      const resultado = await registrarPago(datos)

      if (resultado.exito) {
        toast.success(resultado.mensaje)
        router.push('/jugador')
      } else {
        toast.error(resultado.error)
      }
    } catch {
      toast.error('Error al registrar el pago')
    } finally {
      setCargando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Selección de cuota */}
      <div className="space-y-2">
        <Label htmlFor="cuota" className="text-zinc-300">
          Cuota a pagar *
        </Label>
        <Select
          value={cuotaSeleccionadaId}
          onValueChange={(value) => {
            setValue('cuotaJugadorId', value)
            const cuota = cuotasPendientes.find((c) => c.id === value)
            if (cuota) {
              setValue('monto', cuota.montoPendiente)
            }
          }}
        >
          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
            <SelectValue placeholder="Selecciona una cuota" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            {cuotasPendientes.map((cuota) => (
              <SelectItem
                key={cuota.id}
                value={cuota.id}
                className="text-white focus:bg-zinc-700 focus:text-white"
              >
                <div className="flex items-center gap-2">
                  <span>{cuota.nombre}</span>
                  {cuota.vencida && (
                    <Badge variant="outline" className="border-red-500/30 text-red-400 text-xs">
                      Vencida
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.cuotaJugadorId && (
          <p className="text-sm text-red-400">{errors.cuotaJugadorId.message}</p>
        )}
      </div>

      {/* Info de la cuota seleccionada */}
      {cuotaActual && (
        <div
          className={`p-4 rounded-lg border ${
            cuotaActual.vencida
              ? 'border-red-500/30 bg-red-500/5'
              : 'border-emerald-500/30 bg-emerald-500/5'
          }`}
        >
          {cuotaActual.vencida && (
            <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Esta cuota está vencida</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-zinc-400">{cuotaActual.torneo}</p>
              <p className="text-xs text-zinc-500">
                Vencimiento:{' '}
                {format(cuotaActual.fechaVencimiento, "d 'de' MMMM yyyy", {
                  locale: es,
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">Monto pendiente</p>
              <p className="text-xl font-bold text-white">
                ${cuotaActual.montoPendiente.toLocaleString('es-AR')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Monto */}
      <div className="space-y-2">
        <Label htmlFor="monto" className="text-zinc-300">
          Monto a pagar *
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            $
          </span>
          <Input
            id="monto"
            type="number"
            step="0.01"
            {...register('monto', { valueAsNumber: true })}
            className="pl-8 bg-zinc-800 border-zinc-700 text-white"
          />
        </div>
        {errors.monto && (
          <p className="text-sm text-red-400">{errors.monto.message}</p>
        )}
        {cuotaActual && (
          <p className="text-xs text-zinc-500">
            Puedes hacer pagos parciales si lo necesitas
          </p>
        )}
      </div>

      {/* Método de pago */}
      <div className="space-y-2">
        <Label htmlFor="metodo" className="text-zinc-300">
          Método de pago *
        </Label>
        <Select
          value={watch('metodo')}
          onValueChange={(value) =>
            setValue('metodo', value as PagoFormData['metodo'])
          }
        >
          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            {metodosPago.map((metodo) => (
              <SelectItem
                key={metodo.value}
                value={metodo.value}
                className="text-white focus:bg-zinc-700 focus:text-white"
              >
                {metodo.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* URL del comprobante */}
      <div className="space-y-2">
        <Label htmlFor="comprobante" className="text-zinc-300">
          URL del comprobante (opcional)
        </Label>
        <Input
          id="comprobante"
          type="url"
          placeholder="https://..."
          {...register('comprobante')}
          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
        />
        <p className="text-xs text-zinc-500">
          Sube tu comprobante a un servicio de imágenes y pega el enlace aquí
        </p>
        {errors.comprobante && (
          <p className="text-sm text-red-400">{errors.comprobante.message}</p>
        )}
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="notas" className="text-zinc-300">
          Notas adicionales (opcional)
        </Label>
        <Textarea
          id="notas"
          placeholder="Algún comentario sobre el pago..."
          {...register('notas')}
          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
        />
      </div>

      {/* Botón submit */}
      <Button
        type="submit"
        disabled={cargando || !cuotaSeleccionadaId}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-6"
      >
        {cargando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Registrar pago
      </Button>

      <p className="text-xs text-zinc-500 text-center">
        Tu pago será revisado por un administrador antes de ser aprobado
      </p>
    </form>
  )
}
