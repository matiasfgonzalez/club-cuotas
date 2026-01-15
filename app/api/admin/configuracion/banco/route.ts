
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const bancoSchema = z.object({
  banco: z.string().min(1, 'El nombre del banco es requerido'),
  tipoCuenta: z.string().min(1, 'El tipo de cuenta es requerido'),
  numeroCuenta: z.string().min(1, 'El número de cuenta es requerido'),
  titular: z.string().min(1, 'El titular es requerido'),
  cbu: z.string().optional(),
  alias: z.string().optional(),
  activo: z.boolean().default(true),
})

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const usuario = await db.usuario.findUnique({
      where: { id: userId },
    })

    if (usuario?.rol !== 'ADMINISTRADOR') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const validation = bancoSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      )
    }

    const nuevaConfiguracion = await db.configuracionBancaria.create({
      data: validation.data,
    })

    return NextResponse.json(nuevaConfiguracion)
  } catch (error) {
    console.error('Error POST /api/admin/configuracion/banco:', error)
    return NextResponse.json(
      { error: 'Error al guardar la configuración bancaria' },
      { status: 500 }
    )
  }
}
