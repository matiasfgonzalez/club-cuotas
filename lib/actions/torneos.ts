// Server Actions para gestión de torneos
'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { torneoSchema, type TorneoFormData } from '@/lib/validations'
import type { ResultadoAccion, Torneo } from '@/types'

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

// Crear un nuevo torneo
export async function crearTorneo(
  datos: TorneoFormData
): Promise<ResultadoAccion<Torneo>> {
  try {
    await verificarAdmin()

    // Validar datos
    const validacion = torneoSchema.safeParse(datos)
    if (!validacion.success) {
      return {
        exito: false,
        error: validacion.error.issues[0].message,
      }
    }

    const torneo = await db.torneo.create({
      data: {
        nombre: validacion.data.nombre,
        descripcion: validacion.data.descripcion,
        fechaInicio: validacion.data.fechaInicio,
        fechaFin: validacion.data.fechaFin,
        activo: validacion.data.activo,
      },
    })

    revalidatePath('/admin/torneos')
    revalidatePath('/admin')

    return {
      exito: true,
      datos: torneo,
      mensaje: 'Torneo creado exitosamente',
    }
  } catch (error) {
    console.error('Error al crear torneo:', error)
    return {
      exito: false,
      error: error instanceof Error ? error.message : 'Error al crear torneo',
    }
  }
}

// Actualizar un torneo existente
export async function actualizarTorneo(
  id: string,
  datos: TorneoFormData
): Promise<ResultadoAccion<Torneo>> {
  try {
    await verificarAdmin()

    // Validar datos
    const validacion = torneoSchema.safeParse(datos)
    if (!validacion.success) {
      return {
        exito: false,
        error: validacion.error.issues[0].message,
      }
    }

    const torneo = await db.torneo.update({
      where: { id },
      data: {
        nombre: validacion.data.nombre,
        descripcion: validacion.data.descripcion,
        fechaInicio: validacion.data.fechaInicio,
        fechaFin: validacion.data.fechaFin,
        activo: validacion.data.activo,
      },
    })

    revalidatePath('/admin/torneos')
    revalidatePath('/admin')

    return {
      exito: true,
      datos: torneo,
      mensaje: 'Torneo actualizado exitosamente',
    }
  } catch (error) {
    console.error('Error al actualizar torneo:', error)
    return {
      exito: false,
      error:
        error instanceof Error ? error.message : 'Error al actualizar torneo',
    }
  }
}

// Eliminar un torneo
export async function eliminarTorneo(
  id: string
): Promise<ResultadoAccion<void>> {
  try {
    await verificarAdmin()

    // Verificar que no tenga cuotas o inscripciones activas
    const torneo = await db.torneo.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            cuotas: true,
            inscripciones: true,
          },
        },
      },
    })

    if (!torneo) {
      return {
        exito: false,
        error: 'Torneo no encontrado',
      }
    }

    if (torneo._count.cuotas > 0 || torneo._count.inscripciones > 0) {
      return {
        exito: false,
        error:
          'No se puede eliminar el torneo porque tiene cuotas o inscripciones asociadas',
      }
    }

    await db.torneo.delete({
      where: { id },
    })

    revalidatePath('/admin/torneos')
    revalidatePath('/admin')

    return {
      exito: true,
      datos: undefined,
      mensaje: 'Torneo eliminado exitosamente',
    }
  } catch (error) {
    console.error('Error al eliminar torneo:', error)
    return {
      exito: false,
      error:
        error instanceof Error ? error.message : 'Error al eliminar torneo',
    }
  }
}

// Cambiar estado activo de un torneo
export async function toggleTorneoActivo(
  id: string
): Promise<ResultadoAccion<Torneo>> {
  try {
    await verificarAdmin()

    const torneo = await db.torneo.findUnique({
      where: { id },
    })

    if (!torneo) {
      return {
        exito: false,
        error: 'Torneo no encontrado',
      }
    }

    const torneoActualizado = await db.torneo.update({
      where: { id },
      data: { activo: !torneo.activo },
    })

    revalidatePath('/admin/torneos')
    revalidatePath('/admin')

    return {
      exito: true,
      datos: torneoActualizado,
      mensaje: `Torneo ${torneoActualizado.activo ? 'activado' : 'desactivado'}`,
    }
  } catch (error) {
    console.error('Error al cambiar estado del torneo:', error)
    return {
      exito: false,
      error:
        error instanceof Error
          ? error.message
          : 'Error al cambiar estado del torneo',
    }
  }
}
