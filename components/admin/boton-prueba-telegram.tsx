'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Send, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

type EstadoPrueba = 'idle' | 'loading' | 'success' | 'error'

export function BotonPruebaTelegram() {
  const [estado, setEstado] = useState<EstadoPrueba>('idle')

  const enviarPrueba = async () => {
    setEstado('loading')

    try {
      const response = await fetch('/api/admin/configuracion/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'torneos' }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setEstado('success')
        toast.success(data.mensaje || 'Listado enviado a Telegram')
        setTimeout(() => setEstado('idle'), 3000)
      } else {
        setEstado('error')
        toast.error(data.error || 'Error al enviar mensaje')
        setTimeout(() => setEstado('idle'), 3000)
      }
    } catch (error) {
      console.error('Error al enviar prueba de Telegram:', error)
      setEstado('error')
      toast.error('Error de conexión')
      setTimeout(() => setEstado('idle'), 3000)
    }
  }

  return (
    <Button
      onClick={enviarPrueba}
      disabled={estado === 'loading'}
      variant="outline"
      className={`
        border-zinc-700 hover:bg-zinc-800
        ${estado === 'success' ? 'border-emerald-500/50 text-emerald-400' : ''}
        ${estado === 'error' ? 'border-red-500/50 text-red-400' : ''}
        ${estado === 'idle' ? 'text-zinc-300' : ''}
      `}
    >
      {estado === 'loading' && (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Enviando...
        </>
      )}
      {estado === 'success' && (
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          ¡Enviado!
        </>
      )}
      {estado === 'error' && (
        <>
          <XCircle className="mr-2 h-4 w-4" />
          Error
        </>
      )}
      {estado === 'idle' && (
        <>
          <Send className="mr-2 h-4 w-4" />
          Probar aviso de Telegram
        </>
      )}
    </Button>
  )
}
