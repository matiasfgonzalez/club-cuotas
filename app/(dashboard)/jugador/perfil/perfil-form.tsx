'use client'

// Formulario de edición de perfil
// Componente cliente para manejar el formulario

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
import { User, Phone, Calendar, Shirt, MapPin, Loader2, CreditCard, Heart } from 'lucide-react'

interface PerfilFormProps {
  usuario: {
    id: string
    email: string
    nombreCompleto: string
  }
  jugador: {
    id: string
    nombre: string
    telefono: string
    dni: string
    cuit: string
    obraSocial: string
    fechaNacimiento: string
    posicion: string
    numeroCamiseta?: number
  }
  clerkImageUrl?: string
}

const POSICIONES = [
  'Arquero',
  'Defensor Central',
  'Lateral Derecho',
  'Lateral Izquierdo',
  'Mediocampista Central',
  'Mediocampista Ofensivo',
  'Mediocampista Defensivo',
  'Extremo Derecho',
  'Extremo Izquierdo',
  'Delantero Centro',
  'Segundo Delantero',
]

export function PerfilForm({ usuario, jugador, clerkImageUrl }: PerfilFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    nombreCompleto: usuario.nombreCompleto,
    nombre: jugador.nombre,
    telefono: jugador.telefono,
    dni: jugador.dni,
    cuit: jugador.cuit,
    obraSocial: jugador.obraSocial,
    fechaNacimiento: jugador.fechaNacimiento,
    posicion: jugador.posicion,
    numeroCamiseta: jugador.numeroCamiseta?.toString() || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/jugador/perfil', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombreCompleto: formData.nombreCompleto,
          nombre: formData.nombre,
          telefono: formData.telefono || null,
          dni: formData.dni || null,
          cuit: formData.cuit || null,
          obraSocial: formData.obraSocial || null,
          fechaNacimiento: formData.fechaNacimiento || null,
          posicion: formData.posicion || null,
          numeroCamiseta: formData.numeroCamiseta ? parseInt(formData.numeroCamiseta) : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al guardar el perfil')
      }

      toast.success('Perfil actualizado correctamente')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar los cambios')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información de cuenta */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-400" />
            Información de cuenta
          </CardTitle>
          <CardDescription>
            Datos de tu cuenta de usuario
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            {clerkImageUrl && (
              <img
                src={clerkImageUrl}
                alt="Avatar"
                className="w-16 h-16 rounded-full border-2 border-zinc-700"
              />
            )}
            <div>
              <p className="text-white font-medium">{usuario.email}</p>
              <p className="text-xs text-zinc-500">Email de la cuenta (no editable)</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombreCompleto" className="text-zinc-300">
                Nombre en la cuenta
              </Label>
              <Input
                id="nombreCompleto"
                value={formData.nombreCompleto}
                onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-zinc-300">
                Nombre del jugador
              </Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos personales */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-400" />
            Datos personales
          </CardTitle>
          <CardDescription>
            Información personal y de contacto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="telefono" className="text-zinc-300">
                <Phone className="h-4 w-4 inline mr-1" />
                Teléfono
              </Label>
              <Input
                id="telefono"
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+54 11 1234-5678"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dni" className="text-zinc-300">
                DNI
              </Label>
              <Input
                id="dni"
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                placeholder="12345678"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cuit" className="text-zinc-300">
                CUIT
              </Label>
              <Input
                id="cuit"
                value={formData.cuit}
                onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                placeholder="20-12345678-9"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="obraSocial" className="text-zinc-300">
                <Heart className="h-4 w-4 inline mr-1" />
                Obra Social
              </Label>
              <Input
                id="obraSocial"
                value={formData.obraSocial}
                onChange={(e) => setFormData({ ...formData, obraSocial: e.target.value })}
                placeholder="OSDE, Swiss Medical, etc."
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información deportiva */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shirt className="h-5 w-5 text-emerald-400" />
            Información deportiva
          </CardTitle>
          <CardDescription>
            Datos de tu perfil como jugador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="fechaNacimiento" className="text-zinc-300">
                <Calendar className="h-4 w-4 inline mr-1" />
                Fecha de nacimiento
              </Label>
              <Input
                id="fechaNacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="posicion" className="text-zinc-300">
                <MapPin className="h-4 w-4 inline mr-1" />
                Posición
              </Label>
              <Select
                value={formData.posicion}
                onValueChange={(value) => setFormData({ ...formData, posicion: value })}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Seleccionar posición" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {POSICIONES.map((pos) => (
                    <SelectItem key={pos} value={pos} className="text-white">
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroCamiseta" className="text-zinc-300">
                <Shirt className="h-4 w-4 inline mr-1" />
                Número de camiseta
              </Label>
              <Input
                id="numeroCamiseta"
                type="number"
                min="1"
                max="99"
                value={formData.numeroCamiseta}
                onChange={(e) => setFormData({ ...formData, numeroCamiseta: e.target.value })}
                placeholder="10"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón guardar */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar cambios
        </Button>
      </div>
    </form>
  )
}
