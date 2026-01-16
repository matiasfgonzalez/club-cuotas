// Página de edición de cuota

import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CuotaForm } from "../../cuota-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PaginaEditarCuota({ params }: PageProps) {
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

  // Obtener cuota
  const cuota = await db.cuota.findUnique({
    where: { id },
    include: {
      torneo: true,
    },
  });

  if (!cuota) {
    notFound();
  }

  // Obtener torneos activos
  const torneos = await db.torneo.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
  });

  // Formatear datos para el formulario
  const cuotaFormateada = {
    id: cuota.id,
    torneoId: cuota.torneoId,
    tipo: cuota.tipo,
    nombre: cuota.nombre,
    descripcion: cuota.descripcion || "",
    monto: Number(cuota.monto),
    fechaVencimiento: cuota.fechaVencimiento.toISOString().split("T")[0],
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Editar Cuota</h1>
        <p className="text-zinc-400 mt-1">Modifica los datos de la cuota</p>
      </div>

      <CuotaForm torneos={torneos} cuota={cuotaFormateada} />
    </div>
  );
}
