// API para solicitar asociación de jugador a usuario

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

    const body = await request.json()
    const { jugadorId } = body

    if (!jugadorId) {
      return NextResponse.json(
        { error: 'ID de jugador requerido' },
        { status: 400 }
      )
    }

    // Verificar que el usuario existe y no tiene jugador asociado
    const usuario = await db.usuario.findUnique({
      where: { id: userId },
      include: { jugador: true },
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    if (usuario.jugador) {
      return NextResponse.json(
        { error: 'Ya tienes un jugador asociado' },
        { status: 400 }
      )
    }

    // Verificar que el jugador existe
    const jugador = await db.jugador.findUnique({
      where: { id: jugadorId },
    })

    if (!jugador) {
      return NextResponse.json(
        { error: 'Jugador no encontrado' },
        { status: 404 }
      )
    }

    // Asociar usuario con jugador
    await db.usuario.update({
      where: { id: userId },
      data: {
        jugadorId: jugadorId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al asociar jugador:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
