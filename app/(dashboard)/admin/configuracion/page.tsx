// Página de configuración del sistema (admin)

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings, CreditCard, Plus, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BotonPruebaTelegram } from '@/components/admin/boton-prueba-telegram'
import { telegramConfigurado } from '@/lib/telegram'

export default async function PaginaConfiguracion() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/iniciar-sesion')
  }

  const usuario = await db.usuario.findUnique({
    where: { id: userId },
  })

  if (usuario?.rol !== 'ADMINISTRADOR') {
    redirect('/jugador')
  }

  const configuracionesBancarias = await db.configuracionBancaria.findMany({
    orderBy: { creadoEn: 'desc' },
  })

  const telegramActivo = telegramConfigurado()

  return (
    <div className="space-y-8">
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-white">Configuración</h1>
        <p className="text-zinc-400 mt-1">
          Ajustes del sistema y datos bancarios
        </p>
      </div>

      {/* Datos bancarios */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-400" />
              Datos Bancarios
            </CardTitle>
            <CardDescription>
              Cuentas bancarias para recibir pagos de los jugadores
            </CardDescription>
          </div>
          <Button
            asChild
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <Link href="/admin/configuracion/banco/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Agregar cuenta
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {configuracionesBancarias.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="font-semibold text-white mb-2">
                Sin cuentas bancarias
              </h3>
              <p className="text-zinc-500 text-sm mb-4">
                Agrega una cuenta bancaria para que los jugadores puedan hacer
                transferencias
              </p>
              <Button
                asChild
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <Link href="/admin/configuracion/banco/nuevo">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar primera cuenta
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {configuracionesBancarias.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-800/30"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white">{config.banco}</h4>
                      <Badge
                        variant="outline"
                        className={
                          config.activo
                            ? 'border-emerald-500/30 text-emerald-400'
                            : 'border-zinc-600 text-zinc-400'
                        }
                      >
                        {config.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-400">
                      {config.tipoCuenta} • {config.titular}
                    </p>
                    {config.alias && (
                      <p className="text-sm text-zinc-500">
                        Alias: {config.alias}
                      </p>
                    )}
                    {config.cbu && (
                      <p className="text-xs text-zinc-500 font-mono">
                        CBU: {config.cbu}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                    asChild
                  >
                    <Link href={`/admin/configuracion/banco/${config.id}`}>
                      Editar
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Otras configuraciones */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-400" />
            Notificaciones de Telegram
          </CardTitle>
          <CardDescription>
            Configuración del bot de Telegram para recibir avisos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-800/30">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-white">Estado del Bot</h4>
                <Badge
                  variant="outline"
                  className={
                    telegramActivo
                      ? 'border-emerald-500/30 text-emerald-400'
                      : 'border-amber-500/30 text-amber-400'
                  }
                >
                  {telegramActivo ? 'Configurado' : 'No configurado'}
                </Badge>
              </div>
              <p className="text-sm text-zinc-400">
                {telegramActivo
                  ? 'El bot está listo para enviar notificaciones'
                  : 'Configura TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID en las variables de entorno'}
              </p>
            </div>
            {telegramActivo && <BotonPruebaTelegram />}
          </div>
          {telegramActivo && (
            <p className="text-xs text-zinc-500">
              Al presionar el botón se enviará un listado de todos los torneos
              del sistema al chat de Telegram configurado.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Configuración General */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5 text-zinc-400" />
            Configuración General
          </CardTitle>
          <CardDescription>Ajustes generales del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-500 text-sm">
            Más opciones de configuración próximamente...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
