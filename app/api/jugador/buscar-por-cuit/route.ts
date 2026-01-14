// API para buscar jugador por CUIT

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const cuit = searchParams.get('cuit')

    if (!cuit || cuit.trim().length < 5) {
      return NextResponse.json(
        { error: 'CUIT inválido' },
        { status: 400 }
      )
    }

    // Buscar jugador por CUIT
    const jugador = await db.jugador.findFirst({
      where: {
        cuit: cuit.trim(),
        activo: true,
      },
      select: {
        id: true,
        nombre: true,
      },
    })

    if (!jugador) {
      return NextResponse.json(
        { error: 'No se encontró un jugador con ese CUIT' },
        { status: 404 }
      )
    }

    return NextResponse.json(jugador)
  } catch (error) {
    console.error('Error al buscar jugador:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
