// Página de edición de jugador

import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { JugadorEditForm } from "./jugador-edit-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PaginaEditarJugador({ params }: PageProps) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/iniciar-sesion");
  }

  const usuario = await db.usuario.findUnique({
    where: { id: userId },
  });

  if (usuario?.rol !== "ADMINISTRADOR") {
    redirect("/jugador");
  }

  // Obtener jugador con sus inscripciones
  const jugador = await db.jugador.findUnique({
    where: { id },
    include: {
      inscripciones: {
        select: { torneoId: true },
      },
    },
  });

  if (!jugador) {
    notFound();
  }

  // Obtener torneos activos
  const torneos = await db.torneo.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
  });

  // Formatear datos para el formulario
  const jugadorFormateado = {
    id: jugador.id,
    nombre: jugador.nombre,
    telefono: jugador.telefono || "",
    dni: jugador.dni || "",
    cuit: jugador.cuit || "",
    obraSocial: jugador.obraSocial || "",
    fechaNacimiento: jugador.fechaNacimiento
      ? jugador.fechaNacimiento.toISOString().split("T")[0]
      : "",
    posicion: jugador.posicion || "",
    numeroCamiseta: jugador.numeroCamiseta?.toString() || "",
    activo: jugador.activo,
    torneosInscritos: jugador.inscripciones.map((i) => i.torneoId),
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Editar Jugador</h1>
        <p className="text-zinc-400 mt-1">
          Modifica los datos de {jugador.nombre}
        </p>
      </div>

      <JugadorEditForm jugador={jugadorFormateado} torneos={torneos} />
    </div>
  );
}
