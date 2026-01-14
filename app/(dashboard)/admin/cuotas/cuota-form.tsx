'use client'

// Formulario de creación/edición de cuota

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { CreditCard, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Torneo {
  id: string
  nombre: string
}

interface CuotaFormProps {
  torneos: Torneo[]
  cuota?: {
    id: string
    torneoId: string
    tipo: string
    nombre: string
    descripcion: string
    monto: number
    fechaVencimiento: string
  }
}

const TIPOS_CUOTA = [
  { value: 'MENSUAL', label: 'Mensual' },
  { value: 'UNICA', label: 'Única' },
  { value: 'INSCRIPCION', label: 'Inscripción' },
  { value: 'EXTRAORDINARIA', label: 'Extraordinaria' },
]

export function CuotaForm({ torneos, cuota }: CuotaFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!cuota

  const [formData, setFormData] = useState({
    torneoId: cuota?.torneoId || '',
    tipo: cuota?.tipo || 'MENSUAL',
    nombre: cuota?.nombre || '',
    descripcion: cuota?.descripcion || '',
    monto: cuota?.monto?.toString() || '',
    fechaVencimiento: cuota?.fechaVencimiento || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = isEditing 
        ? `/api/admin/cuotas/${cuota.id}` 
        : '/api/admin/cuotas'
      
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          torneoId: formData.torneoId,
          tipo: formData.tipo,
          nombre: formData.nombre,
          descripcion: formData.descripcion || null,
          monto: parseFloat(formData.monto),
          fechaVencimiento: formData.fechaVencimiento,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al guardar')
      }

      toast.success(isEditing ? 'Cuota actualizada' : 'Cuota creada correctamente')
      router.push('/admin/cuotas')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar la cuota')
    } finally {
      setIsLoading(false)
    }
  }

  if (torneos.length === 0) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CreditCard className="h-12 w-12 text-zinc-600 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No hay torneos activos
          </h3>
          <p className="text-zinc-500 text-sm mb-4 text-center">
            Primero debes crear un torneo para poder agregar cuotas
          </p>
          <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <Link href="/admin/torneos/nuevo">
              Crear torneo
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-400" />
            Información de la cuota
          </CardTitle>
          <CardDescription>
            Define los detalles de la cuota a cobrar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="torneoId" className="text-zinc-300">
                Torneo *
              </Label>
              <Select
                value={formData.torneoId}
                onValueChange={(value) => setFormData({ ...formData, torneoId: value })}
                required
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Seleccionar torneo" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {torneos.map((torneo) => (
                    <SelectItem key={torneo.id} value={torneo.id} className="text-white">
                      {torneo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo" className="text-zinc-300">
                Tipo de cuota *
              </Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {TIPOS_CUOTA.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value} className="text-white">
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-zinc-300">
              Nombre de la cuota *
            </Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Cuota Mensual Enero 2024"
              className="bg-zinc-800 border-zinc-700 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion" className="text-zinc-300">
              Descripción
            </Label>
            <Input
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción opcional"
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="monto" className="text-zinc-300">
                Monto ($) *
              </Label>
              <Input
                id="monto"
                type="number"
                min="0"
                step="0.01"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                placeholder="0.00"
                className="bg-zinc-800 border-zinc-700 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaVencimiento" className="text-zinc-300">
                Fecha de vencimiento *
              </Label>
              <Input
                id="fechaVencimiento"
                type="date"
                value={formData.fechaVencimiento}
                onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botones */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          asChild
          className="border-zinc-700 text-zinc-300"
        >
          <Link href="/admin/cuotas">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>

        <Button
          type="submit"
          disabled={isLoading || !formData.torneoId}
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Guardar cambios' : 'Crear cuota'}
        </Button>
      </div>
    </form>
  )
}
