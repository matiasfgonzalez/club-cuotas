// API para jugador individual: GET, PUT, DELETE

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Obtener jugador por ID
export async function GET(request: Request, { params }: RouteParams) {
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

    const jugador = await db.jugador.findUnique({
      where: { id },
      include: {
        usuarios: true,
        inscripciones: {
          include: { torneo: true },
        },
      },
    });

    if (!jugador) {
      return NextResponse.json(
        { error: "Jugador no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(jugador);
  } catch (error) {
    console.error("Error GET jugador:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// PUT - Actualizar jugador
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
    const {
      nombre,
      telefono,
      dni,
      cuit,
      obraSocial,
      fechaNacimiento,
      posicion,
      numeroCamiseta,
      activo,
    } = body;

    // Validaciones
    if (!nombre || nombre.trim().length < 2) {
      return NextResponse.json(
        { error: "El nombre es requerido (mínimo 2 caracteres)" },
        { status: 400 }
      );
    }

    // Verificar que el jugador existe
    const jugadorExistente = await db.jugador.findUnique({
      where: { id },
    });

    if (!jugadorExistente) {
      return NextResponse.json(
        { error: "Jugador no encontrado" },
        { status: 404 }
      );
    }

    // Verificar CUIT único si se proporciona y es diferente al actual
    if (cuit && cuit !== jugadorExistente.cuit) {
      const cuitExistente = await db.jugador.findFirst({
        where: {
          cuit,
          NOT: { id },
        },
      });

      if (cuitExistente) {
        return NextResponse.json(
          { error: "El CUIT ya está registrado por otro jugador" },
          { status: 400 }
        );
      }
    }

    // Actualizar jugador
    const jugadorActualizado = await db.jugador.update({
      where: { id },
      data: {
        nombre: nombre.trim(),
        telefono: telefono || null,
        dni: dni || null,
        cuit: cuit || null,
        obraSocial: obraSocial || null,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        posicion: posicion || null,
        numeroCamiseta: numeroCamiseta ? parseInt(numeroCamiseta) : null,
        activo: activo !== undefined ? activo : jugadorExistente.activo,
      },
    });

    return NextResponse.json(jugadorActualizado);
  } catch (error) {
    console.error("Error PUT jugador:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// DELETE - Desactivar jugador (soft delete)
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

    // Verificar que el jugador existe
    const jugador = await db.jugador.findUnique({
      where: { id },
      include: {
        cuotasAsignadas: {
          where: { estadoPago: { not: "PAGADO" } },
        },
      },
    });

    if (!jugador) {
      return NextResponse.json(
        { error: "Jugador no encontrado" },
        { status: 404 }
      );
    }

    // Soft delete: desactivar jugador
    await db.jugador.update({
      where: { id },
      data: { activo: false },
    });

    return NextResponse.json({
      success: true,
      message: "Jugador desactivado correctamente",
    });
  } catch (error) {
    console.error("Error DELETE jugador:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
