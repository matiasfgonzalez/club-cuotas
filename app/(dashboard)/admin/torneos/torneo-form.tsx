'use client'

// Formulario de creación/edición de torneo

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
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Trophy, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface TorneoFormProps {
  torneo?: {
    id: string
    nombre: string
    descripcion: string
    fechaInicio: string
    fechaFin: string
    activo: boolean
  }
}

export function TorneoForm({ torneo }: TorneoFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!torneo

  const [formData, setFormData] = useState({
    nombre: torneo?.nombre || '',
    descripcion: torneo?.descripcion || '',
    fechaInicio: torneo?.fechaInicio || '',
    fechaFin: torneo?.fechaFin || '',
    activo: torneo?.activo ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = isEditing 
        ? `/api/admin/torneos/${torneo.id}` 
        : '/api/admin/torneos'
      
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          descripcion: formData.descripcion || null,
          fechaInicio: formData.fechaInicio,
          fechaFin: formData.fechaFin || null,
          activo: formData.activo,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al guardar')
      }

      toast.success(isEditing ? 'Torneo actualizado' : 'Torneo creado correctamente')
      router.push('/admin/torneos')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar el torneo')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-emerald-400" />
            Información del torneo
          </CardTitle>
          <CardDescription>
            Datos básicos del torneo o competencia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-zinc-300">
              Nombre del torneo *
            </Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Liga Amateur 2024"
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
              placeholder="Descripción opcional del torneo"
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fechaInicio" className="text-zinc-300">
                Fecha de inicio *
              </Label>
              <Input
                id="fechaInicio"
                type="date"
                value={formData.fechaInicio}
                onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaFin" className="text-zinc-300">
                Fecha de fin (opcional)
              </Label>
              <Input
                id="fechaFin"
                type="date"
                value={formData.fechaFin}
                onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="activo"
              checked={formData.activo}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, activo: checked as boolean })
              }
            />
            <Label htmlFor="activo" className="text-zinc-300 cursor-pointer">
              Torneo activo
            </Label>
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
          <Link href="/admin/torneos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>

        <Button
          type="submit"
          disabled={isLoading}
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Guardar cambios' : 'Crear torneo'}
        </Button>
      </div>
    </form>
  )
}
