// Server Actions para gestión de pagos
'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { pagoSchema, aprobacionPagoSchema, type PagoFormData, type AprobacionPagoFormData } from '@/lib/validations'
import type { ResultadoAccion, Pago } from '@/types'

// Registrar un nuevo pago (jugador)
export async function registrarPago(
  datos: PagoFormData
): Promise<ResultadoAccion<Pago>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { exito: false, error: 'No autorizado' }
    }

    // Obtener el jugador
    const usuario = await db.usuario.findUnique({
      where: { id: userId },
      include: { jugador: true },
    })

    if (!usuario?.jugador) {
      return { exito: false, error: 'Perfil de jugador no encontrado' }
    }

    // Validar datos
    const validacion = pagoSchema.safeParse(datos)
    if (!validacion.success) {
      return {
        exito: false,
        error: validacion.error.issues[0].message,
      }
    }

    // Verificar que la cuota pertenece al jugador
    const cuotaJugador = await db.cuotaJugador.findUnique({
      where: { id: validacion.data.cuotaJugadorId },
      include: { cuota: true },
    })

    if (!cuotaJugador) {
      return { exito: false, error: 'Cuota no encontrada' }
    }

    if (cuotaJugador.jugadorId !== usuario.jugador.id) {
      return { exito: false, error: 'Esta cuota no te pertenece' }
    }

    if (cuotaJugador.estadoPago === 'PAGADO') {
      return { exito: false, error: 'Esta cuota ya está completamente pagada' }
    }

    // Verificar que el monto no exceda lo pendiente
    const pagosAprobados = await db.pago.findMany({
      where: {
        cuotaJugadorId: cuotaJugador.id,
        estado: 'APROBADO',
      },
    })

    const totalPagado = pagosAprobados.reduce(
      (sum: number, p) => sum + p.monto.toNumber(),
      0
    )
    const montoTotal =
      cuotaJugador.montoPersonalizado?.toNumber() ||
      cuotaJugador.cuota.monto.toNumber()
    const montoPendiente = montoTotal - totalPagado

    if (validacion.data.monto > montoPendiente) {
      return {
        exito: false,
        error: `El monto excede lo pendiente ($${montoPendiente.toFixed(2)})`,
      }
    }

    // Crear el pago
    const pago = await db.pago.create({
      data: {
        cuotaJugadorId: validacion.data.cuotaJugadorId,
        jugadorId: usuario.jugador.id,
        monto: validacion.data.monto,
        metodo: validacion.data.metodo,
        comprobante: validacion.data.comprobante || null,
        notas: validacion.data.notas || null,
        estado: 'PENDIENTE',
      },
    })

    revalidatePath('/jugador')
    revalidatePath('/jugador/pagos')
    revalidatePath('/jugador/historial')
    revalidatePath('/admin/pagos')

    return {
      exito: true,
      datos: pago,
      mensaje: 'Pago registrado. Pendiente de aprobación.',
    }
  } catch (error) {
    console.error('Error al registrar pago:', error)
    return {
      exito: false,
      error: error instanceof Error ? error.message : 'Error al registrar pago',
    }
  }
}

// Aprobar o rechazar un pago (admin)
export async function procesarPago(
  datos: AprobacionPagoFormData
): Promise<ResultadoAccion<Pago>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { exito: false, error: 'No autorizado' }
    }

    // Verificar que es admin
    const usuario = await db.usuario.findUnique({
      where: { id: userId },
    })

    if (usuario?.rol !== 'ADMINISTRADOR') {
      return { exito: false, error: 'No tienes permisos de administrador' }
    }

    // Validar datos
    const validacion = aprobacionPagoSchema.safeParse(datos)
    if (!validacion.success) {
      return {
        exito: false,
        error: validacion.error.issues[0].message,
      }
    }

    const pago = await db.pago.findUnique({
      where: { id: validacion.data.pagoId },
      include: { cuotaJugador: { include: { cuota: true } } },
    })

    if (!pago) {
      return { exito: false, error: 'Pago no encontrado' }
    }

    if (pago.estado !== 'PENDIENTE') {
      return { exito: false, error: 'Este pago ya fue procesado' }
    }

    // Actualizar el pago
    const pagoActualizado = await db.pago.update({
      where: { id: validacion.data.pagoId },
      data: {
        estado: validacion.data.estado,
        aprobadoPorId: userId,
        fechaAprobacion: new Date(),
        notas: validacion.data.notas || pago.notas,
      },
    })

    // Si fue aprobado, verificar si la cuota está completamente pagada
    if (validacion.data.estado === 'APROBADO') {
      const pagosAprobados = await db.pago.findMany({
        where: {
          cuotaJugadorId: pago.cuotaJugadorId,
          estado: 'APROBADO',
        },
      })

      const totalPagado = pagosAprobados.reduce(
        (sum: number, p) => sum + p.monto.toNumber(),
        0
      )
      const montoTotal =
        pago.cuotaJugador.montoPersonalizado?.toNumber() ||
        pago.cuotaJugador.cuota.monto.toNumber()

      let nuevoEstado: 'PENDIENTE' | 'PARCIAL' | 'PAGADO' = 'PENDIENTE'
      if (totalPagado >= montoTotal) {
        nuevoEstado = 'PAGADO'
      } else if (totalPagado > 0) {
        nuevoEstado = 'PARCIAL'
      }

      await db.cuotaJugador.update({
        where: { id: pago.cuotaJugadorId },
        data: { estadoPago: nuevoEstado },
      })
    }

    revalidatePath('/admin/pagos')
    revalidatePath('/admin')
    revalidatePath('/jugador')
    revalidatePath('/jugador/historial')

    return {
      exito: true,
      datos: pagoActualizado,
      mensaje:
        validacion.data.estado === 'APROBADO'
          ? 'Pago aprobado exitosamente'
          : 'Pago rechazado',
    }
  } catch (error) {
    console.error('Error al procesar pago:', error)
    return {
      exito: false,
      error: error instanceof Error ? error.message : 'Error al procesar pago',
    }
  }
}

// Obtener pagos pendientes de aprobación (admin)
export async function obtenerPagosPendientes() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return []
    }

    const usuario = await db.usuario.findUnique({
      where: { id: userId },
    })

    if (usuario?.rol !== 'ADMINISTRADOR') {
      return []
    }

    const pagos = await db.pago.findMany({
      where: { estado: 'PENDIENTE' },
      include: {
        jugador: { include: { usuario: true } },
        cuotaJugador: { include: { cuota: { include: { torneo: true } } } },
      },
      orderBy: { fechaPago: 'desc' },
    })

    return pagos
  } catch (error) {
    console.error('Error al obtener pagos pendientes:', error)
    return []
  }
}
