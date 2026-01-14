// API para crear cuotas

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
    const { torneoId, tipo, nombre, descripcion, monto, fechaVencimiento } = body

    // Validar campos requeridos
    if (!torneoId) {
      return NextResponse.json(
        { error: 'El torneo es requerido' },
        { status: 400 }
      )
    }

    if (!nombre || nombre.trim().length < 2) {
      return NextResponse.json(
        { error: 'El nombre es requerido (mínimo 2 caracteres)' },
        { status: 400 }
      )
    }

    if (!monto || monto <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a 0' },
        { status: 400 }
      )
    }

    if (!fechaVencimiento) {
      return NextResponse.json(
        { error: 'La fecha de vencimiento es requerida' },
        { status: 400 }
      )
    }

    // Verificar que el torneo existe
    const torneo = await db.torneo.findUnique({
      where: { id: torneoId },
    })

    if (!torneo) {
      return NextResponse.json(
        { error: 'El torneo no existe' },
        { status: 400 }
      )
    }

    // Crear cuota
    const cuota = await db.cuota.create({
      data: {
        torneoId,
        tipo: tipo || 'MENSUAL',
        nombre: nombre.trim(),
        descripcion: descripcion || null,
        monto,
        fechaVencimiento: new Date(fechaVencimiento),
      },
    })

    return NextResponse.json(cuota, { status: 201 })
  } catch (error) {
    console.error('Error al crear cuota:', error)
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

    const cuotas = await db.cuota.findMany({
      orderBy: { fechaVencimiento: 'desc' },
      include: {
        torneo: {
          select: { nombre: true },
        },
        _count: {
          select: { asignaciones: true },
        },
      },
    })

    return NextResponse.json(cuotas)
  } catch (error) {
    console.error('Error al obtener cuotas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
