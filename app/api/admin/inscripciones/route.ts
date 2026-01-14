// API para gestionar inscripciones de jugadores a torneos

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
    const { torneoId, jugadorIds } = body

    // Validar campos
    if (!torneoId) {
      return NextResponse.json(
        { error: 'El torneo es requerido' },
        { status: 400 }
      )
    }

    if (!jugadorIds || !Array.isArray(jugadorIds) || jugadorIds.length === 0) {
      return NextResponse.json(
        { error: 'Debes seleccionar al menos un jugador' },
        { status: 400 }
      )
    }

    // Verificar que el torneo existe
    const torneo = await db.torneo.findUnique({
      where: { id: torneoId },
      include: { cuotas: true },
    })

    if (!torneo) {
      return NextResponse.json(
        { error: 'El torneo no existe' },
        { status: 400 }
      )
    }

    // Crear inscripciones y asignar cuotas existentes
    const resultados = await Promise.all(
      jugadorIds.map(async (jugadorId: string) => {
        // Verificar que el jugador existe
        const jugador = await db.jugador.findUnique({
          where: { id: jugadorId },
        })

        if (!jugador) {
          return { jugadorId, error: 'Jugador no encontrado' }
        }

        // Verificar si ya está inscrito
        const inscripcionExistente = await db.inscripcionTorneo.findUnique({
          where: {
            jugadorId_torneoId: {
              jugadorId,
              torneoId,
            },
          },
        })

        if (inscripcionExistente) {
          return { jugadorId, error: 'Ya está inscrito' }
        }

        // Crear inscripción
        const inscripcion = await db.inscripcionTorneo.create({
          data: {
            jugadorId,
            torneoId,
          },
        })

        // Asignar todas las cuotas del torneo al jugador
        if (torneo.cuotas.length > 0) {
          await Promise.all(
            torneo.cuotas.map((cuota) =>
              db.cuotaJugador.create({
                data: {
                  cuotaId: cuota.id,
                  jugadorId,
                  estadoPago: 'PENDIENTE',
                },
              })
            )
          )
        }

        return { jugadorId, inscripcion }
      })
    )

    return NextResponse.json({
      success: true,
      resultados,
    })
  } catch (error) {
    console.error('Error al crear inscripciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const inscripcionId = searchParams.get('id')

    if (!inscripcionId) {
      return NextResponse.json(
        { error: 'ID de inscripción requerido' },
        { status: 400 }
      )
    }

    // Eliminar inscripción (las cuotas asignadas se eliminan por cascade)
    await db.inscripcionTorneo.delete({
      where: { id: inscripcionId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al eliminar inscripción:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
