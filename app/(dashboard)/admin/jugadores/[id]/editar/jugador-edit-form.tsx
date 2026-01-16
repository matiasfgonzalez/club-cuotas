"use client";

// Formulario de edición de jugador

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { User, Loader2, ArrowLeft, CreditCard, Shield } from "lucide-react";
import Link from "next/link";

interface Torneo {
  id: string;
  nombre: string;
}

interface JugadorData {
  id: string;
  nombre: string;
  telefono: string;
  dni: string;
  cuit: string;
  obraSocial: string;
  fechaNacimiento: string;
  posicion: string;
  numeroCamiseta: string;
  activo: boolean;
  torneosInscritos: string[];
}

interface JugadorEditFormProps {
  jugador: JugadorData;
  torneos: Torneo[];
}

const POSICIONES = [
  "Arquero",
  "Defensor Central",
  "Lateral Derecho",
  "Lateral Izquierdo",
  "Mediocampista Central",
  "Mediocampista Ofensivo",
  "Mediocampista Defensivo",
  "Extremo Derecho",
  "Extremo Izquierdo",
  "Delantero Centro",
  "Segundo Delantero",
];

export function JugadorEditForm({ jugador, torneos }: JugadorEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    nombre: jugador.nombre,
    telefono: jugador.telefono,
    dni: jugador.dni,
    cuit: jugador.cuit,
    obraSocial: jugador.obraSocial,
    fechaNacimiento: jugador.fechaNacimiento,
    posicion: jugador.posicion,
    numeroCamiseta: jugador.numeroCamiseta,
    activo: jugador.activo,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/jugadores/${jugador.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          telefono: formData.telefono || null,
          dni: formData.dni || null,
          cuit: formData.cuit || null,
          obraSocial: formData.obraSocial || null,
          fechaNacimiento: formData.fechaNacimiento || null,
          posicion: formData.posicion || null,
          numeroCamiseta: formData.numeroCamiseta || null,
          activo: formData.activo,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar");
      }

      toast.success("Jugador actualizado correctamente");
      router.push(`/admin/jugadores/${jugador.id}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al actualizar el jugador"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Datos personales */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-400" />
            Datos del jugador
          </CardTitle>
          <CardDescription>Información básica del jugador</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-zinc-300">
              Nombre completo *
            </Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              placeholder="Juan Pérez"
              className="bg-zinc-800 border-zinc-700 text-white"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="telefono" className="text-zinc-300">
                Teléfono
              </Label>
              <Input
                id="telefono"
                type="tel"
                value={formData.telefono}
                onChange={(e) =>
                  setFormData({ ...formData, telefono: e.target.value })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, dni: e.target.value })
                }
                placeholder="12345678"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="cuit"
                className="text-zinc-300 flex items-center gap-1"
              >
                <CreditCard className="h-4 w-4" />
                CUIT (único - para asociación)
              </Label>
              <Input
                id="cuit"
                value={formData.cuit}
                onChange={(e) =>
                  setFormData({ ...formData, cuit: e.target.value })
                }
                placeholder="20-12345678-9"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
              <p className="text-xs text-zinc-500">
                El usuario podrá asociarse usando este CUIT
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="obraSocial" className="text-zinc-300">
                Obra Social
              </Label>
              <Input
                id="obraSocial"
                value={formData.obraSocial}
                onChange={(e) =>
                  setFormData({ ...formData, obraSocial: e.target.value })
                }
                placeholder="OSDE, Swiss Medical, etc."
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos deportivos */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Información deportiva</CardTitle>
          <CardDescription>Datos del jugador en el equipo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="fechaNacimiento" className="text-zinc-300">
                Fecha de nacimiento
              </Label>
              <Input
                id="fechaNacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) =>
                  setFormData({ ...formData, fechaNacimiento: e.target.value })
                }
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="posicion" className="text-zinc-300">
                Posición
              </Label>
              <Select
                value={formData.posicion || undefined}
                onValueChange={(value) =>
                  setFormData({ ...formData, posicion: value })
                }
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Seleccionar" />
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
                Número de camiseta
              </Label>
              <Input
                id="numeroCamiseta"
                type="number"
                min="1"
                max="99"
                value={formData.numeroCamiseta}
                onChange={(e) =>
                  setFormData({ ...formData, numeroCamiseta: e.target.value })
                }
                placeholder="10"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estado del jugador */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            Estado del jugador
          </CardTitle>
          <CardDescription>
            Controla si el jugador está activo en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
            <div>
              <p className="font-medium text-white">Jugador activo</p>
              <p className="text-sm text-zinc-500">
                Los jugadores inactivos no aparecen en las listas ni pueden
                recibir cuotas
              </p>
            </div>
            <Switch
              checked={formData.activo}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, activo: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Información de torneos (solo lectura) */}
      {jugador.torneosInscritos.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Torneos inscritos</CardTitle>
            <CardDescription>
              Para modificar inscripciones, usa la sección de torneos del
              jugador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {torneos
                .filter((t) => jugador.torneosInscritos.includes(t.id))
                .map((torneo) => (
                  <span
                    key={torneo.id}
                    className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm"
                  >
                    {torneo.nombre}
                  </span>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botones */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          asChild
          className="border-zinc-700 text-zinc-300"
        >
          <Link href={`/admin/jugadores/${jugador.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>

        <Button
          type="submit"
          disabled={isLoading || !formData.nombre.trim()}
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
