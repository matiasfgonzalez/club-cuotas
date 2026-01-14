// Server Actions para gestión de cuotas
'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { cuotaSchema, type CuotaFormData } from '@/lib/validations'
import type { ResultadoAccion, Cuota } from '@/types'

// Verificar que el usuario es administrador
async function verificarAdmin() {
  const { userId } = await auth()
  if (!userId) {
    throw new Error('No autorizado')
  }

  const usuario = await db.usuario.findUnique({
    where: { id: userId },
  })

  if (usuario?.rol !== 'ADMINISTRADOR') {
    throw new Error('No tienes permisos de administrador')
  }

  return usuario
}

// Crear una nueva cuota y asignarla a jugadores
export async function crearCuota(
  datos: CuotaFormData
): Promise<ResultadoAccion<Cuota>> {
  try {
    await verificarAdmin()

    // Validar datos
    const validacion = cuotaSchema.safeParse(datos)
    if (!validacion.success) {
      return {
        exito: false,
        error: validacion.error.issues[0].message,
      }
    }

    // Verificar que el torneo existe
    const torneo = await db.torneo.findUnique({
      where: { id: validacion.data.torneoId },
    })

    if (!torneo) {
      return { exito: false, error: 'Torneo no encontrado' }
    }

    // Verificar que los jugadores existen
    const jugadores = await db.jugador.findMany({
      where: { id: { in: validacion.data.jugadoresIds } },
    })

    if (jugadores.length !== validacion.data.jugadoresIds.length) {
      return { exito: false, error: 'Algunos jugadores no fueron encontrados' }
    }

    // Crear la cuota
    const cuota = await db.cuota.create({
      data: {
        torneoId: validacion.data.torneoId,
        tipo: validacion.data.tipo,
        nombre: validacion.data.nombre,
        descripcion: validacion.data.descripcion,
        monto: validacion.data.monto,
        fechaVencimiento: validacion.data.fechaVencimiento,
      },
    })

    // Asignar la cuota a los jugadores
    await db.cuotaJugador.createMany({
      data: validacion.data.jugadoresIds.map((jugadorId) => ({
        cuotaId: cuota.id,
        jugadorId,
        estadoPago: 'PENDIENTE',
      })),
    })

    revalidatePath('/admin/cuotas')
    revalidatePath('/admin')
    revalidatePath('/jugador')

    return {
      exito: true,
      datos: cuota,
      mensaje: `Cuota creada y asignada a ${jugadores.length} jugadores`,
    }
  } catch (error) {
    console.error('Error al crear cuota:', error)
    return {
      exito: false,
      error: error instanceof Error ? error.message : 'Error al crear cuota',
    }
  }
}

// Actualizar una cuota existente
export async function actualizarCuota(
  id: string,
  datos: Omit<CuotaFormData, 'jugadoresIds'> & { jugadoresIds?: string[] }
): Promise<ResultadoAccion<Cuota>> {
  try {
    await verificarAdmin()

    const cuota = await db.cuota.update({
      where: { id },
      data: {
        torneoId: datos.torneoId,
        tipo: datos.tipo,
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        monto: datos.monto,
        fechaVencimiento: datos.fechaVencimiento,
      },
    })

    revalidatePath('/admin/cuotas')
    revalidatePath('/admin')
    revalidatePath('/jugador')

    return {
      exito: true,
      datos: cuota,
      mensaje: 'Cuota actualizada exitosamente',
    }
  } catch (error) {
    console.error('Error al actualizar cuota:', error)
    return {
      exito: false,
      error:
        error instanceof Error ? error.message : 'Error al actualizar cuota',
    }
  }
}

// Eliminar una cuota (solo si no tiene pagos)
export async function eliminarCuota(id: string): Promise<ResultadoAccion<void>> {
  try {
    await verificarAdmin()

    // Verificar que no tenga pagos
    const cuota = await db.cuota.findUnique({
      where: { id },
      include: {
        asignaciones: {
          include: {
            _count: { select: { pagos: true } },
          },
        },
      },
    })

    if (!cuota) {
      return { exito: false, error: 'Cuota no encontrada' }
    }

    const tienePagos = cuota.asignaciones.some(
      (a) => a._count.pagos > 0
    )

    if (tienePagos) {
      return {
        exito: false,
        error: 'No se puede eliminar la cuota porque tiene pagos asociados',
      }
    }

    // Eliminar asignaciones primero, luego la cuota
    await db.cuotaJugador.deleteMany({
      where: { cuotaId: id },
    })

    await db.cuota.delete({
      where: { id },
    })

    revalidatePath('/admin/cuotas')
    revalidatePath('/admin')
    revalidatePath('/jugador')

    return {
      exito: true,
      datos: undefined,
      mensaje: 'Cuota eliminada exitosamente',
    }
  } catch (error) {
    console.error('Error al eliminar cuota:', error)
    return {
      exito: false,
      error:
        error instanceof Error ? error.message : 'Error al eliminar cuota',
    }
  }
}

// Asignar cuota a más jugadores
export async function asignarCuotaAJugadores(
  cuotaId: string,
  jugadoresIds: string[]
): Promise<ResultadoAccion<number>> {
  try {
    await verificarAdmin()

    const cuota = await db.cuota.findUnique({
      where: { id: cuotaId },
    })

    if (!cuota) {
      return { exito: false, error: 'Cuota no encontrada' }
    }

    // Obtener jugadores ya asignados
    const asignacionesExistentes = await db.cuotaJugador.findMany({
      where: { cuotaId },
      select: { jugadorId: true },
    })

    const jugadoresYaAsignados = new Set(
      asignacionesExistentes.map((a) => a.jugadorId)
    )

    // Filtrar solo los nuevos
    const nuevosJugadores = jugadoresIds.filter(
      (id) => !jugadoresYaAsignados.has(id)
    )

    if (nuevosJugadores.length === 0) {
      return {
        exito: false,
        error: 'Todos los jugadores ya tienen asignada esta cuota',
      }
    }

    await db.cuotaJugador.createMany({
      data: nuevosJugadores.map((jugadorId) => ({
        cuotaId,
        jugadorId,
        estadoPago: 'PENDIENTE',
      })),
    })

    revalidatePath('/admin/cuotas')
    revalidatePath('/jugador')

    return {
      exito: true,
      datos: nuevosJugadores.length,
      mensaje: `Cuota asignada a ${nuevosJugadores.length} jugadores`,
    }
  } catch (error) {
    console.error('Error al asignar cuota:', error)
    return {
      exito: false,
      error:
        error instanceof Error ? error.message : 'Error al asignar cuota',
    }
  }
}
