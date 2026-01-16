"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { UserPlus, Loader2, Users } from "lucide-react";

interface Jugador {
  id: string;
  nombre: string;
  numeroCamiseta: number | null;
}

interface GestionarJugadoresDialogProps {
  cuotaId: string;
  jugadoresDisponibles: Jugador[];
}

export function GestionarJugadoresDialog({
  cuotaId,
  jugadoresDisponibles,
}: GestionarJugadoresDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);

  const toggleJugador = (jugadorId: string) => {
    setSeleccionados((prev) =>
      prev.includes(jugadorId)
        ? prev.filter((id) => id !== jugadorId)
        : [...prev, jugadorId]
    );
  };

  const seleccionarTodos = () => {
    if (seleccionados.length === jugadoresDisponibles.length) {
      setSeleccionados([]);
    } else {
      setSeleccionados(jugadoresDisponibles.map((j) => j.id));
    }
  };

  const handleAgregar = async () => {
    if (seleccionados.length === 0) {
      toast.error("Selecciona al menos un jugador");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/cuotas/${cuotaId}/asignar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jugadorIds: seleccionados }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al asignar");
      }

      const result = await response.json();
      toast.success(`${result.count} jugador(es) asignado(s) correctamente`);
      setSeleccionados([]);
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al asignar jugadores"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (jugadoresDisponibles.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <UserPlus className="mr-2 h-4 w-4" />
          Agregar jugadores
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-400" />
            Agregar jugadores a la cuota
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Selecciona los jugadores del torneo que deseas agregar a esta cuota.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Seleccionar todos */}
          <div
            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer bg-zinc-800/50 border border-zinc-700 mb-3"
            onClick={seleccionarTodos}
          >
            <Checkbox
              checked={
                seleccionados.length === jugadoresDisponibles.length &&
                jugadoresDisponibles.length > 0
              }
              onCheckedChange={seleccionarTodos}
              onClick={(e) => e.stopPropagation()}
            />
            <span className="text-white font-medium">
              Seleccionar todos ({jugadoresDisponibles.length})
            </span>
          </div>

          {/* Lista de jugadores */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {jugadoresDisponibles.map((jugador) => (
              <div
                key={jugador.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  seleccionados.includes(jugador.id)
                    ? "bg-emerald-500/10 border border-emerald-500/30"
                    : "bg-zinc-800/30 border border-transparent hover:bg-zinc-800"
                }`}
                onClick={() => toggleJugador(jugador.id)}
              >
                <Checkbox
                  checked={seleccionados.includes(jugador.id)}
                  onCheckedChange={() => toggleJugador(jugador.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                    <span className="text-sm font-medium text-zinc-300">
                      {jugador.nombre.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-white">{jugador.nombre}</p>
                    {jugador.numeroCamiseta && (
                      <p className="text-xs text-zinc-500">
                        #{jugador.numeroCamiseta}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-zinc-700 text-zinc-300"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAgregar}
            disabled={isLoading || seleccionados.length === 0}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Agregar ({seleccionados.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
