// Tipos TypeScript personalizados para la aplicación
// Extienden o complementan los tipos generados por Prisma

import type {
  Usuario,
  Jugador,
  Torneo,
  Cuota,
  CuotaJugador,
  Pago,
  ConfiguracionBancaria,
  RolUsuario,
  TipoCuota,
  EstadoPago,
  EstadoAprobacion,
  MetodoPago,
} from '@prisma/client'

// Re-exportar tipos de Prisma para uso conveniente
export type {
  Usuario,
  Jugador,
  Torneo,
  Cuota,
  CuotaJugador,
  Pago,
  ConfiguracionBancaria,
  RolUsuario,
  TipoCuota,
  EstadoPago,
  EstadoAprobacion,
  MetodoPago,
}

// Tipo de jugador con datos de usuario incluidos
export type JugadorConUsuario = Jugador & {
  usuario: Usuario
}

// Tipo de cuota asignada con información completa
export type CuotaJugadorCompleta = CuotaJugador & {
  cuota: Cuota & {
    torneo: Torneo
  }
  pagos: Pago[]
}

// Tipo de pago con información completa
export type PagoCompleto = Pago & {
  cuotaJugador: CuotaJugador & {
    cuota: Cuota
  }
  jugador: Jugador & {
    usuario: Usuario
  }
  aprobadoPor?: Usuario | null
}

// Tipo para estadísticas del dashboard
export type EstadisticasDashboard = {
  totalJugadores: number
  torneosActivos: number
  pagossPendientes: number
  recaudacionMes: number
  cuotasVencidas: number
}

// Tipo para respuestas de acciones del servidor
export type ResultadoAccion<T = void> = 
  | { exito: true; datos: T; mensaje?: string }
  | { exito: false; error: string }
