// API para cuota individual: GET, PUT, DELETE

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Obtener cuota por ID
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const cuota = await db.cuota.findUnique({
      where: { id },
      include: {
        torneo: true,
        asignaciones: {
          include: {
            jugador: true,
            pagos: {
              where: { estado: "APROBADO" },
            },
          },
        },
      },
    });

    if (!cuota) {
      return NextResponse.json(
        { error: "Cuota no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(cuota);
  } catch (error) {
    console.error("Error GET cuota:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// PUT - Actualizar cuota
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
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
    const { torneoId, tipo, nombre, descripcion, monto, fechaVencimiento } =
      body;

    // Validaciones
    if (!nombre || nombre.trim().length < 2) {
      return NextResponse.json(
        { error: "El nombre es requerido (mínimo 2 caracteres)" },
        { status: 400 }
      );
    }

    if (!monto || monto <= 0) {
      return NextResponse.json(
        { error: "El monto debe ser mayor a 0" },
        { status: 400 }
      );
    }

    if (!fechaVencimiento) {
      return NextResponse.json(
        { error: "La fecha de vencimiento es requerida" },
        { status: 400 }
      );
    }

    // Verificar que la cuota existe
    const cuotaExistente = await db.cuota.findUnique({
      where: { id },
    });

    if (!cuotaExistente) {
      return NextResponse.json(
        { error: "Cuota no encontrada" },
        { status: 404 }
      );
    }

    // Actualizar cuota
    const cuotaActualizada = await db.cuota.update({
      where: { id },
      data: {
        torneoId: torneoId || cuotaExistente.torneoId,
        tipo: tipo || cuotaExistente.tipo,
        nombre: nombre.trim(),
        descripcion: descripcion || null,
        monto,
        fechaVencimiento: new Date(fechaVencimiento),
      },
    });

    return NextResponse.json(cuotaActualizada);
  } catch (error) {
    console.error("Error PUT cuota:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// DELETE - Eliminar cuota
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    // Verificar que la cuota existe
    const cuota = await db.cuota.findUnique({
      where: { id },
      include: {
        asignaciones: {
          include: {
            pagos: true,
          },
        },
      },
    });

    if (!cuota) {
      return NextResponse.json(
        { error: "Cuota no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si hay pagos asociados
    const tienePagos = cuota.asignaciones.some((a) => a.pagos.length > 0);

    if (tienePagos) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar una cuota con pagos registrados. Primero elimina los pagos.",
        },
        { status: 400 }
      );
    }

    // Eliminar cuota (las asignaciones se eliminan en cascada)
    await db.cuota.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Cuota eliminada correctamente",
    });
  } catch (error) {
    console.error("Error DELETE cuota:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
