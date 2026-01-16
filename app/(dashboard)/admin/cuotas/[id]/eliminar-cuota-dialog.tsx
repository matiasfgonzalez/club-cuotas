"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

interface EliminarCuotaDialogProps {
  cuotaId: string;
  cuotaNombre: string;
}

export function EliminarCuotaDialog({
  cuotaId,
  cuotaNombre,
}: EliminarCuotaDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleEliminar = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/cuotas/${cuotaId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar");
      }

      toast.success("Cuota eliminada correctamente");
      router.push("/admin/cuotas");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar la cuota"
      );
    } finally {
      setIsLoading(false);
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            ¿Eliminar cuota?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            Estás por eliminar la cuota{" "}
            <span className="text-white font-medium">
              &quot;{cuotaNombre}&quot;
            </span>
            . Esta acción no se puede deshacer y eliminará todas las
            asignaciones a jugadores.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleEliminar}
            disabled={isLoading}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
