// Esquemas de validación Zod para formularios
// Todos los mensajes de error están en español
// Compatible con Zod v4

import { z } from 'zod'

// =====================================
// VALIDACIONES DE TORNEO
// =====================================

export const torneoSchema = z.object({
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  descripcion: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
  fechaInicio: z.date({ message: 'La fecha de inicio es requerida' }),
  fechaFin: z.date().optional().nullable(),
  activo: z.boolean().default(true),
})

export type TorneoFormData = z.infer<typeof torneoSchema>

// =====================================
// VALIDACIONES DE JUGADOR
// =====================================

export const jugadorSchema = z.object({
  email: z.string().email('Email inválido'),
  nombreCompleto: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  telefono: z
    .string()
    .regex(/^[\d\s\-+()]+$/, 'Teléfono inválido')
    .optional()
    .or(z.literal('')),
  fechaNacimiento: z.date().optional().nullable(),
  posicion: z.string().max(50, 'La posición no puede exceder 50 caracteres').optional(),
  numeroCamiseta: z
    .number()
    .int('El número debe ser entero')
    .min(1, 'El número debe ser mayor a 0')
    .max(99, 'El número debe ser menor a 100')
    .optional()
    .nullable(),
})

export type JugadorFormData = z.infer<typeof jugadorSchema>

// =====================================
// VALIDACIONES DE CUOTA
// =====================================

export const tipoCuotaEnum = z.enum(['UNICA', 'MENSUAL', 'INSCRIPCION', 'EXTRAORDINARIA'])

export const cuotaSchema = z.object({
  torneoId: z.string().min(1, 'Debe seleccionar un torneo'),
  tipo: tipoCuotaEnum,
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  descripcion: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
  monto: z
    .number({ message: 'El monto debe ser un número' })
    .positive('El monto debe ser mayor a 0')
    .multipleOf(0.01, 'El monto solo puede tener 2 decimales'),
  fechaVencimiento: z.date({ message: 'La fecha de vencimiento es requerida' }),
  jugadoresIds: z
    .array(z.string())
    .min(1, 'Debe seleccionar al menos un jugador'),
})

export type CuotaFormData = z.infer<typeof cuotaSchema>

// =====================================
// VALIDACIONES DE PAGO
// =====================================

export const metodoPagoEnum = z.enum(['EFECTIVO', 'TRANSFERENCIA', 'MERCADOPAGO', 'OTRO'])

export const pagoSchema = z.object({
  cuotaJugadorId: z.string().min(1, 'Debe seleccionar una cuota'),
  monto: z
    .number({ message: 'El monto debe ser un número' })
    .positive('El monto debe ser mayor a 0')
    .multipleOf(0.01, 'El monto solo puede tener 2 decimales'),
  metodo: metodoPagoEnum,
  comprobante: z.string().url('URL de comprobante inválida').optional().or(z.literal('')),
  notas: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').optional(),
})

export type PagoFormData = z.infer<typeof pagoSchema>

// =====================================
// VALIDACIONES DE APROBACIÓN DE PAGO
// =====================================

export const estadoAprobacionEnum = z.enum(['PENDIENTE', 'APROBADO', 'RECHAZADO'])

export const aprobacionPagoSchema = z.object({
  pagoId: z.string().min(1, 'ID de pago requerido'),
  estado: estadoAprobacionEnum,
  notas: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').optional(),
})

export type AprobacionPagoFormData = z.infer<typeof aprobacionPagoSchema>

// =====================================
// VALIDACIONES DE CONFIGURACIÓN BANCARIA
// =====================================

export const configuracionBancariaSchema = z.object({
  banco: z
    .string()
    .min(2, 'El nombre del banco debe tener al menos 2 caracteres')
    .max(100, 'El nombre del banco no puede exceder 100 caracteres'),
  tipoCuenta: z.string().min(1, 'El tipo de cuenta es requerido'),
  numeroCuenta: z
    .string()
    .min(5, 'El número de cuenta debe tener al menos 5 caracteres')
    .max(30, 'El número de cuenta no puede exceder 30 caracteres'),
  titular: z
    .string()
    .min(2, 'El nombre del titular debe tener al menos 2 caracteres')
    .max(100, 'El nombre del titular no puede exceder 100 caracteres'),
  cbu: z
    .string()
    .length(22, 'El CBU debe tener exactamente 22 dígitos')
    .regex(/^\d+$/, 'El CBU solo puede contener números')
    .optional()
    .or(z.literal('')),
  alias: z
    .string()
    .max(50, 'El alias no puede exceder 50 caracteres')
    .optional(),
  activo: z.boolean().default(true),
})

export type ConfiguracionBancariaFormData = z.infer<typeof configuracionBancariaSchema>

// =====================================
// VALIDACIONES DE ELIMINACIÓN DE PAGO
// =====================================

export const eliminacionPagoSchema = z.object({
  pagoId: z.string().min(1, 'ID de pago requerido'),
  motivo: z
    .string()
    .min(10, 'El motivo debe tener al menos 10 caracteres')
    .max(500, 'El motivo no puede exceder 500 caracteres'),
})

export type EliminacionPagoFormData = z.infer<typeof eliminacionPagoSchema>

