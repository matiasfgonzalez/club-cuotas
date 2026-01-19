// API para configuración bancaria individual: GET, PATCH, DELETE

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const bancoSchema = z.object({
  banco: z.string().min(1, "El nombre del banco es requerido"),
  tipoCuenta: z.string().min(1, "El tipo de cuenta es requerido"),
  numeroCuenta: z.string().min(1, "El número de cuenta es requerido"),
  titular: z.string().min(1, "El titular es requerido"),
  cbu: z.string().optional(),
  alias: z.string().optional(),
  activo: z.boolean().default(true),
});

// GET - Obtener configuración bancaria por ID
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
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const configuracion = await db.configuracionBancaria.findUnique({
      where: { id },
    });

    if (!configuracion) {
      return NextResponse.json(
        { error: "Configuración no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(configuracion);
  } catch (error) {
    console.error("Error GET /api/admin/configuracion/banco/[id]:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// PATCH - Actualizar configuración bancaria
export async function PATCH(request: Request, { params }: RouteParams) {
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
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Verificar que existe
    const existente = await db.configuracionBancaria.findUnique({
      where: { id },
    });

    if (!existente) {
      return NextResponse.json(
        { error: "Configuración no encontrada" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = bancoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.issues },
        { status: 400 }
      );
    }

    const configuracionActualizada = await db.configuracionBancaria.update({
      where: { id },
      data: validation.data,
    });

    return NextResponse.json(configuracionActualizada);
  } catch (error) {
    console.error("Error PATCH /api/admin/configuracion/banco/[id]:", error);
    return NextResponse.json(
      { error: "Error al actualizar la configuración" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar configuración bancaria
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
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Verificar que existe
    const existente = await db.configuracionBancaria.findUnique({
      where: { id },
    });

    if (!existente) {
      return NextResponse.json(
        { error: "Configuración no encontrada" },
        { status: 404 }
      );
    }

    await db.configuracionBancaria.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Configuración eliminada correctamente",
    });
  } catch (error) {
    console.error("Error DELETE /api/admin/configuracion/banco/[id]:", error);
    return NextResponse.json(
      { error: "Error al eliminar la configuración" },
      { status: 500 }
    );
  }
}
