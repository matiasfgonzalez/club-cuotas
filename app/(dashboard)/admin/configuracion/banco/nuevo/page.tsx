
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
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { BancoForm } from '../banco-form'

export default async function NuevaCuentaBancariaPage() {
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          asChild
          className="border-zinc-700"
        >
          <Link href="/admin/configuracion">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">Agregar cuenta bancaria</h1>
          <p className="text-zinc-400 mt-1">
            Configura una nueva cuenta para recibir transferencias
          </p>
        </div>
      </div>

      {/* Formulario */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Datos de la cuenta</CardTitle>
          <CardDescription>
            Ingresa los detalles bancarios que verán los jugadores al pagar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BancoForm />
        </CardContent>
      </Card>
    </div>
  )
}
