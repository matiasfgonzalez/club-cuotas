// API para crear y listar jugadores (sin usuario)

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST: Crear nuevo jugador
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
    const adminUsuario = await db.usuario.findUnique({
      where: { id: userId },
    })

    if (adminUsuario?.rol !== 'ADMINISTRADOR') {
      return NextResponse.json(
        { error: 'No tienes permisos para esta acción' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      nombre,
      telefono,
      dni,
      cuit,
      obraSocial,
      fechaNacimiento,
      posicion,
      numeroCamiseta,
      torneoIds,
    } = body

    // Validar campos requeridos
    if (!nombre || nombre.trim().length < 2) {
      return NextResponse.json(
        { error: 'El nombre es requerido (mínimo 2 caracteres)' },
        { status: 400 }
      )
    }

    // Verificar CUIT único si se proporciona
    if (cuit) {
      const cuitExistente = await db.jugador.findFirst({
        where: { cuit },
      })

      if (cuitExistente) {
        return NextResponse.json(
          { error: 'El CUIT ya está registrado' },
          { status: 400 }
        )
      }
    }

    // Crear jugador (independiente de usuario)
    const jugador = await db.jugador.create({
      data: {
        nombre: nombre.trim(),
        telefono: telefono || null,
        dni: dni || null,
        cuit: cuit || null,
        obraSocial: obraSocial || null,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        posicion: posicion || null,
        numeroCamiseta: numeroCamiseta || null,
      },
    })

    // Inscribir en torneos seleccionados
    if (torneoIds && Array.isArray(torneoIds) && torneoIds.length > 0) {
      for (const torneoId of torneoIds) {
        // Crear inscripción
        await db.inscripcionTorneo.create({
          data: {
            jugadorId: jugador.id,
            torneoId,
          },
        })

        // Asignar cuotas del torneo
        const cuotasDelTorneo = await db.cuota.findMany({
          where: { torneoId },
        })

        if (cuotasDelTorneo.length > 0) {
          await db.cuotaJugador.createMany({
            data: cuotasDelTorneo.map((cuota) => ({
              cuotaId: cuota.id,
              jugadorId: jugador.id,
              estadoPago: 'PENDIENTE',
            })),
          })
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        jugador,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al crear jugador:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET: Listar todos los jugadores
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar que sea administrador
    const adminUsuario = await db.usuario.findUnique({
      where: { id: userId },
    })

    if (adminUsuario?.rol !== 'ADMINISTRADOR') {
      return NextResponse.json(
        { error: 'No tienes permisos para esta acción' },
        { status: 403 }
      )
    }

    const jugadores = await db.jugador.findMany({
      where: { activo: true },
      include: {
        usuarios: {
          select: {
            id: true,
            email: true,
            nombreCompleto: true,
          },
        },
        inscripciones: {
          include: { torneo: true },
        },
        _count: {
          select: {
            cuotasAsignadas: true,
          },
        },
      },
      orderBy: { nombre: 'asc' },
    })

    return NextResponse.json(jugadores)
  } catch (error) {
    console.error('Error al obtener jugadores:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
