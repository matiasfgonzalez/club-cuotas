// Servicio de notificaciones de Telegram
// Envía notificaciones a un grupo/chat de administradores cuando ocurren eventos importantes

import TelegramBot from 'node-telegram-bot-api'

// El bot se inicializa solo si hay token configurado
let bot: TelegramBot | null = null

function getBot(): TelegramBot | null {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.warn(
      'TELEGRAM_BOT_TOKEN no configurado - notificaciones deshabilitadas',
    )
    return null
  }

  bot ??= new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false })

  return bot
}

function getChatId(): string | null {
  if (!process.env.TELEGRAM_CHAT_ID) {
    console.warn(
      'TELEGRAM_CHAT_ID no configurado - notificaciones deshabilitadas',
    )
    return null
  }
  return process.env.TELEGRAM_CHAT_ID
}

// Función helper para enviar mensajes
async function enviarMensaje(mensaje: string): Promise<boolean> {
  try {
    const telegramBot = getBot()
    const chatId = getChatId()

    if (!telegramBot || !chatId) {
      return false
    }

    await telegramBot.sendMessage(chatId, mensaje, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    })

    return true
  } catch (error) {
    console.error('Error al enviar mensaje de Telegram:', error)
    return false
  }
}

// ================================================
// NOTIFICACIONES DE EVENTOS
// ================================================

/**
 * Notifica cuando un nuevo usuario se registra en el sistema
 */
export async function notificarNuevoUsuario(datos: {
  nombreCompleto: string
  email: string
}): Promise<boolean> {
  const mensaje = `
🆕 <b>Nuevo Usuario Registrado</b>

👤 <b>Nombre:</b> ${escapeHtml(datos.nombreCompleto)}
📧 <b>Email:</b> ${escapeHtml(datos.email)}
📅 <b>Fecha:</b> ${formatearFecha(new Date())}

El usuario aún no tiene un jugador asociado.
`

  return enviarMensaje(mensaje)
}

/**
 * Notifica cuando un usuario se asocia a un jugador existente
 */
export async function notificarAsociacionJugador(datos: {
  nombreUsuario: string
  emailUsuario: string
  nombreJugador: string
  cuitJugador?: string | null
}): Promise<boolean> {
  const mensaje = `
🔗 <b>Usuario Asociado a Jugador</b>

👤 <b>Usuario:</b> ${escapeHtml(datos.nombreUsuario)}
📧 <b>Email:</b> ${escapeHtml(datos.emailUsuario)}

⚽ <b>Jugador:</b> ${escapeHtml(datos.nombreJugador)}
${datos.cuitJugador ? `🆔 <b>CUIT:</b> ${escapeHtml(datos.cuitJugador)}` : ''}

📅 <b>Fecha:</b> ${formatearFecha(new Date())}
`

  return enviarMensaje(mensaje)
}

/**
 * Notifica cuando un jugador envía un pago pendiente de aprobación
 */
export async function notificarPagoPendiente(datos: {
  nombreJugador: string
  monto: number
  metodo: string
  nombreCuota: string
  nombreTorneo: string
  comprobante?: string | null
}): Promise<boolean> {
  const mensaje = `
💰 <b>Nuevo Pago Pendiente de Aprobación</b>

⚽ <b>Jugador:</b> ${escapeHtml(datos.nombreJugador)}
💵 <b>Monto:</b> $${datos.monto.toFixed(2)}
💳 <b>Método:</b> ${formatearMetodoPago(datos.metodo)}

📋 <b>Cuota:</b> ${escapeHtml(datos.nombreCuota)}
🏆 <b>Torneo:</b> ${escapeHtml(datos.nombreTorneo)}
${
  datos.comprobante
    ? `📎 <b>Comprobante:</b> Adjunto`
    : '⚠️ <b>Sin comprobante adjunto</b>'
}

📅 <b>Fecha:</b> ${formatearFecha(new Date())}

<i>Ingresa al panel de administración para aprobar o rechazar este pago.</i>
`

  return enviarMensaje(mensaje)
}

// ================================================
// FUNCIONES AUXILIARES
// ================================================

/**
 * Escapa caracteres HTML especiales para evitar errores en Telegram
 */
function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/**
 * Formatea una fecha para mostrar en el mensaje
 */
function formatearFecha(fecha: Date): string {
  return fecha.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formatea el método de pago para mostrar
 */
function formatearMetodoPago(metodo: string): string {
  const metodos: Record<string, string> = {
    EFECTIVO: '💵 Efectivo',
    TRANSFERENCIA: '🏦 Transferencia',
    DEBITO: '💳 Débito',
    CREDITO: '💳 Crédito',
    MERCADOPAGO: '📱 MercadoPago',
    OTRO: '🔄 Otro',
  }
  return metodos[metodo] || metodo
}

/**
 * Verifica si las notificaciones de Telegram están configuradas
 */
export function telegramConfigurado(): boolean {
  return !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)
}

/**
 * Envía un mensaje de prueba para verificar la configuración
 */
export async function enviarMensajePrueba(): Promise<boolean> {
  const mensaje = `
✅ <b>Conexión Exitosa</b>

El bot de Club Cuotas está correctamente configurado.
Las notificaciones funcionan correctamente.

📅 ${formatearFecha(new Date())}
`

  return enviarMensaje(mensaje)
}

/**
 * Envía un listado de torneos como mensaje de prueba
 */
export async function enviarListadoTorneos(
  torneos: Array<{
    nombre: string
    activo: boolean
    fechaInicio: Date
    fechaFin?: Date | null
  }>,
): Promise<boolean> {
  if (torneos.length === 0) {
    const mensaje = `
🏆 <b>Listado de Torneos - Prueba</b>

⚠️ No hay torneos creados en el sistema.

📅 ${formatearFecha(new Date())}
`
    return enviarMensaje(mensaje)
  }

  const listaTorneos = torneos
    .map((t, i) => {
      const estado = t.activo ? '✅' : '❌'
      const fechaInicio = formatearFecha(t.fechaInicio)
      const fechaFin = t.fechaFin ? formatearFecha(t.fechaFin) : 'En curso'
      return `${i + 1}. ${estado} <b>${escapeHtml(t.nombre)}</b>
   📅 Inicio: ${fechaInicio}
   🏁 Fin: ${fechaFin}`
    })
    .join('\n\n')

  const mensaje = `
🏆 <b>Listado de Torneos - Prueba</b>

Total: ${torneos.length} torneo(s)

${listaTorneos}

📅 Generado: ${formatearFecha(new Date())}
`

  return enviarMensaje(mensaje)
}
