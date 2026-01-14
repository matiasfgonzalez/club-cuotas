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
      nombre,
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
        { error: 'El nombre de cuenta es requerido' },
        { status: 400 }
      )
    }

    if (!nombre || nombre.trim().length < 2) {
      return NextResponse.json(
        { error: 'El nombre del jugador es requerido' },
        { status: 400 }
      )
    }

    // Obtener usuario con jugador
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

    if (!usuario.jugador) {
      return NextResponse.json(
        { error: 'No tienes un jugador asociado' },
        { status: 400 }
      )
    }

    // Verificar CUIT único si se proporciona
    if (cuit) {
      const cuitExistente = await db.jugador.findFirst({
        where: {
          cuit,
          NOT: { id: usuario.jugador.id },
        },
      })

      if (cuitExistente) {
        return NextResponse.json(
          { error: 'El CUIT ya está registrado por otro jugador' },
          { status: 400 }
        )
      }
    }

    // Actualizar usuario
    await db.usuario.update({
      where: { id: userId },
      data: {
        nombreCompleto: nombreCompleto.trim(),
      },
    })

    // Actualizar jugador
    await db.jugador.update({
      where: { id: usuario.jugador.id },
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al actualizar perfil:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
