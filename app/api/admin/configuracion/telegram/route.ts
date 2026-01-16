// API para probar la configuración de Telegram
// Solo accesible para administradores

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  enviarMensajePrueba,
  enviarListadoTorneos,
  telegramConfigurado,
} from '@/lib/telegram'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que es admin
    const usuario = await db.usuario.findUnique({
      where: { id: userId },
    })

    if (usuario?.rol !== 'ADMINISTRADOR') {
      return NextResponse.json(
        { error: 'No tienes permisos de administrador' },
        { status: 403 },
      )
    }

    // Verificar configuración
    if (!telegramConfigurado()) {
      return NextResponse.json(
        {
          error: 'Telegram no está configurado',
          mensaje:
            'Configura TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID en las variables de entorno',
        },
        { status: 400 },
      )
    }

    // Verificar si se solicita enviar torneos
    const body = await request.json().catch(() => ({}))
    const tipo = body.tipo || 'prueba'

    let enviado = false
    let mensajeExito = ''

    if (tipo === 'torneos') {
      // Obtener todos los torneos
      const torneos = await db.torneo.findMany({
        orderBy: { fechaInicio: 'desc' },
        select: {
          nombre: true,
          activo: true,
          fechaInicio: true,
          fechaFin: true,
        },
      })

      enviado = await enviarListadoTorneos(torneos)
      mensajeExito = `Listado de ${torneos.length} torneo(s) enviado correctamente`
    } else {
      // Enviar mensaje de prueba simple
      enviado = await enviarMensajePrueba()
      mensajeExito = 'Mensaje de prueba enviado correctamente'
    }

    if (enviado) {
      return NextResponse.json({
        success: true,
        mensaje: mensajeExito,
      })
    } else {
      return NextResponse.json(
        {
          error: 'No se pudo enviar el mensaje',
          mensaje: 'Verifica el token del bot y el ID del chat',
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error('Error al probar Telegram:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que es admin
    const usuario = await db.usuario.findUnique({
      where: { id: userId },
    })

    if (usuario?.rol !== 'ADMINISTRADOR') {
      return NextResponse.json(
        { error: 'No tienes permisos de administrador' },
        { status: 403 },
      )
    }

    return NextResponse.json({
      configurado: telegramConfigurado(),
      tokenPresente: !!process.env.TELEGRAM_BOT_TOKEN,
      chatIdPresente: !!process.env.TELEGRAM_CHAT_ID,
    })
  } catch (error) {
    console.error('Error al verificar Telegram:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    )
  }
}
