// Página de edición de cuenta bancaria

import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Landmark } from 'lucide-react'
import Link from 'next/link'
import { BancoForm } from '../banco-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditarCuentaBancariaPage({ params }: PageProps) {
  const { id } = await params
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

  // Obtener cuenta bancaria
  const configuracion = await db.configuracionBancaria.findUnique({
    where: { id },
  })

  if (!configuracion) {
    notFound()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          asChild
          className="border-zinc-700 hover:bg-zinc-800 hover:border-emerald-500/50"
        >
          <Link href="/admin/configuracion">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">
            Editar cuenta bancaria
          </h1>
          <p className="text-zinc-400 mt-1">
            Modifica los datos de la cuenta: {configuracion.banco}
          </p>
        </div>
      </div>

      {/* Formulario */}
      <Card className="bg-zinc-900/50 border-zinc-800 shadow-xl">
        <CardHeader className="border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Landmark className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <CardTitle className="text-white text-xl">
                Datos de la cuenta
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Modifica los detalles bancarios que verán los jugadores al pagar
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <BancoForm
            initialData={{
              id: configuracion.id,
              banco: configuracion.banco,
              tipoCuenta: configuracion.tipoCuenta,
              numeroCuenta: configuracion.numeroCuenta,
              titular: configuracion.titular,
              cbu: configuracion.cbu || '',
              alias: configuracion.alias || '',
              activo: configuracion.activo,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
