// API para crear torneos

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar que sea administrador
    const usuario = await db.usuario.findUnique({
      where: { id: userId },
    })

    if (usuario?.rol !== 'ADMINISTRADOR') {
      return NextResponse.json(
        { error: 'No tienes permisos para esta acción' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { nombre, descripcion, fechaInicio, fechaFin, activo } = body

    // Validar campos requeridos
    if (!nombre || nombre.trim().length < 2) {
      return NextResponse.json(
        { error: 'El nombre es requerido (mínimo 2 caracteres)' },
        { status: 400 }
      )
    }

    if (!fechaInicio) {
      return NextResponse.json(
        { error: 'La fecha de inicio es requerida' },
        { status: 400 }
      )
    }

    // Crear torneo
    const torneo = await db.torneo.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion || null,
        fechaInicio: new Date(fechaInicio),
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        activo: activo ?? true,
      },
    })

    return NextResponse.json(torneo, { status: 201 })
  } catch (error) {
    console.error('Error al crear torneo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const torneos = await db.torneo.findMany({
      orderBy: { fechaInicio: 'desc' },
      include: {
        _count: {
          select: {
            inscripciones: true,
            cuotas: true,
          },
        },
      },
    })

    return NextResponse.json(torneos)
  } catch (error) {
    console.error('Error al obtener torneos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
