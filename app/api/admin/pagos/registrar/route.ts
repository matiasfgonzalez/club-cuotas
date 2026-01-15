
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { EstadoPago, MetodoPago } from '@prisma/client'

// GET: Obtener datos para los selectores (Cuotas de un torneo, Jugadores de una cuota)
export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar rol de administrador
    const usuario = await db.usuario.findUnique({ where: { id: userId } })
    if (usuario?.rol !== 'ADMINISTRADOR') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') // 'cuotas' | 'jugadores'
    const id = searchParams.get('id') // torneoId | cuotaId

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    // Obtener cuotas de un torneo
    if (tipo === 'cuotas') {
      const cuotas = await db.cuota.findMany({
        where: { torneoId: id },
        orderBy: { fechaVencimiento: 'asc' },
        select: {
          id: true,
          nombre: true,
          monto: true,
          tipo: true,
        },
      })
      return NextResponse.json(cuotas)
    }

    // Obtener jugadores con deuda en una cuota específica
    if (tipo === 'jugadores') {
      const asignaciones = await db.cuotaJugador.findMany({
        where: {
          cuotaId: id,
          estadoPago: { in: ['PENDIENTE', 'PARCIAL'] },
        },
        include: {
          jugador: {
            select: {
              id: true,
              nombre: true,
              dni: true,
            },
          },
          cuota: { select: { monto: true } },
          pagos: {
            where: { estado: 'APROBADO' },
            select: { monto: true },
          },
        },
        orderBy: { jugador: { nombre: 'asc' } },
      })

      // Mapear a un formato amigable y calcular saldo pendiente
      const jugadores = asignaciones.map((a) => {
        const montoTotal = a.montoPersonalizado?.toNumber() || a.cuota.monto.toNumber()
        const montoPagado = a.pagos.reduce((sum, p) => sum + p.monto.toNumber(), 0)
        const saldoPendiente = montoTotal - montoPagado

        return {
           id: a.jugador.id, // ID del Jugador
           cuotaJugadorId: a.id, // ID de la asignación (necesario para el pago)
           nombre: a.jugador.nombre,
           dni: a.jugador.dni,
           saldoPendiente,
        }
      })

      return NextResponse.json(jugadores)
    }

    return NextResponse.json({ error: 'Tipo de consulta inválido' }, { status: 400 })

  } catch (error) {
    console.error('Error GET /api/admin/pagos/registrar:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST: Registrar el pago manual
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const usuarioAdmin = await db.usuario.findUnique({ where: { id: userId } })
    if (usuarioAdmin?.rol !== 'ADMINISTRADOR') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      cuotaJugadorId, 
      jugadorId, 
      monto, 
      metodo, 
      comprobante, 
      notas 
    } = body

    if (!cuotaJugadorId || !jugadorId || !monto || !metodo) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    // 1. Crear el pago aprobado directamente
    const nuevoPago = await db.pago.create({
      data: {
        cuotaJugadorId,
        jugadorId,
        monto,
        metodo: metodo as MetodoPago,
        comprobante: comprobante || null,
        notas: notas || 'Pago registrado manualmente por administrador',
        estado: 'APROBADO', // Directamente aprobado
        aprobadoPorId: userId,
        fechaAprobacion: new Date(),
        fechaPago: new Date(), // Asumimos fecha actual, podría ser parametrizable
      },
    })

    // 2. Recalcular estado de la cuota
    const cuotaJugador = await db.cuotaJugador.findUnique({
      where: { id: cuotaJugadorId },
      include: {
        cuota: true,
        pagos: { where: { estado: 'APROBADO' } },
      },
    })

    if (cuotaJugador) {
        const montoTotal = cuotaJugador.montoPersonalizado?.toNumber() || cuotaJugador.cuota.monto.toNumber()
        const totalPagado = cuotaJugador.pagos.reduce((sum, p) => sum + p.monto.toNumber(), 0)
        
        let nuevoEstado: EstadoPago = 'PENDIENTE'
        if (totalPagado >= montoTotal - 0.01) { // Tolerancia pequeña
            nuevoEstado = 'PAGADO'
        } else if (totalPagado > 0) {
            nuevoEstado = 'PARCIAL'
        }

        if (nuevoEstado !== cuotaJugador.estadoPago) {
            await db.cuotaJugador.update({
                where: { id: cuotaJugadorId },
                data: { estadoPago: nuevoEstado }
            })
        }
    }

    return NextResponse.json({ success: true, pago: nuevoPago })

  } catch (error) {
    console.error('Error POST /api/admin/pagos/registrar:', error)
    return NextResponse.json({ error: 'Error al registrar pago' }, { status: 500 })
  }
}
