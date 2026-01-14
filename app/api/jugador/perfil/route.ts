// API para actualizar el perfil del jugador

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      nombreCompleto, 
      telefono, 
      dni, 
      cuit, 
      obraSocial,
      fechaNacimiento, 
      posicion, 
      numeroCamiseta 
    } = body

    // Validar nombre
    if (!nombreCompleto || nombreCompleto.trim().length < 2) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    // Verificar CUIT único si se proporciona
    if (cuit) {
      const cuitExistente = await db.jugador.findFirst({
        where: {
          cuit,
          NOT: { usuarioId: userId },
        },
      })

      if (cuitExistente) {
        return NextResponse.json(
          { error: 'El CUIT ya está registrado por otro jugador' },
          { status: 400 }
        )
      }
    }

    // Actualizar usuario (solo nombreCompleto ahora)
    await db.usuario.update({
      where: { id: userId },
      data: {
        nombreCompleto: nombreCompleto.trim(),
      },
    })

    // Actualizar jugador si existe
    const jugador = await db.jugador.findUnique({
      where: { usuarioId: userId },
    })

    if (jugador) {
      await db.jugador.update({
        where: { usuarioId: userId },
        data: {
          telefono: telefono || null,
          dni: dni || null,
          cuit: cuit || null,
          obraSocial: obraSocial || null,
          fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
          posicion: posicion || null,
          numeroCamiseta: numeroCamiseta || null,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al actualizar perfil:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
