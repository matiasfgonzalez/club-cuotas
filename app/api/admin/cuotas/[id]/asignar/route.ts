// API para asignar jugadores a una cuota

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: cuotaId } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const usuario = await db.usuario.findUnique({
      where: { id: userId },
    });

    if (usuario?.rol !== "ADMINISTRADOR") {
      return NextResponse.json(
        { error: "No tienes permisos" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { jugadorIds } = body;

    if (!jugadorIds || !Array.isArray(jugadorIds) || jugadorIds.length === 0) {
      return NextResponse.json(
        { error: "Debes seleccionar al menos un jugador" },
        { status: 400 }
      );
    }

    // Verificar que la cuota existe
    const cuota = await db.cuota.findUnique({
      where: { id: cuotaId },
    });

    if (!cuota) {
      return NextResponse.json(
        { error: "Cuota no encontrada" },
        { status: 404 }
      );
    }

    // Crear asignaciones (ignorar duplicados)
    const result = await db.cuotaJugador.createMany({
      data: jugadorIds.map((jugadorId: string) => ({
        cuotaId,
        jugadorId,
        estadoPago: "PENDIENTE",
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count} jugador(es) asignado(s) correctamente`,
    });
  } catch (error) {
    console.error("Error POST asignar cuota:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
