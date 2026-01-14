// API para crear jugadores desde admin

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
      email,
      nombreCompleto,
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
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    if (!nombreCompleto || nombreCompleto.trim().length < 2) {
      return NextResponse.json(
        { error: 'El nombre es requerido (mínimo 2 caracteres)' },
        { status: 400 }
      )
    }

    // Verificar que el email no esté en uso
    const emailExistente = await db.usuario.findUnique({
      where: { email },
    })

    if (emailExistente) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
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

    // Generar un ID temporal para el usuario (se actualizará cuando inicie sesión con Clerk)
    const tempUserId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Crear usuario (sin telefono, ahora está en Jugador)
    const usuario = await db.usuario.create({
      data: {
        id: tempUserId,
        email: email.toLowerCase().trim(),
        nombreCompleto: nombreCompleto.trim(),
        rol: 'JUGADOR',
      },
    })

    // Crear jugador con todos los datos
    const jugador = await db.jugador.create({
      data: {
        usuarioId: usuario.id,
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
        usuario,
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
