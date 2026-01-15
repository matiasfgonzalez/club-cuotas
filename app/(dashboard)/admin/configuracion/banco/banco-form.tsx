'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'

const formSchema = z.object({
  banco: z.string().min(1, 'El nombre del banco es requerido'),
  tipoCuenta: z.string().min(1, 'El tipo de cuenta es requerido'),
  numeroCuenta: z.string().min(1, 'El número de cuenta es requerido'),
  titular: z.string().min(1, 'El titular de la cuenta es requerido'),
  cbu: z.string().optional(),
  alias: z.string().optional(),
  activo: z.boolean().default(true),
})

type FormValues = z.infer<typeof formSchema>

interface BancoFormProps {
  initialData?: FormValues & { id: string }
}

export function BancoForm({ initialData }: BancoFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      banco: '',
      tipoCuenta: '',
      numeroCuenta: '',
      titular: '',
      cbu: '',
      alias: '',
      activo: true,
    },
  })

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      // Determinar si es crear o editar (url y método)
      const url = initialData 
        ? `/api/admin/configuracion/banco/${initialData.id}`
        : '/api/admin/configuracion/banco'
      
      const method = initialData ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        throw new Error('Error al guardar la configuración')
      }

      toast.success(initialData ? 'Cuenta actualizada' : 'Cuenta creada correctamente')
      router.refresh()
      router.push('/admin/configuracion')
    } catch (error) {
      console.error(error)
      toast.error('Ocurrió un error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="banco"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Banco</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: Banco Provincia" 
                    className="bg-zinc-800 border-zinc-700"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tipoCuenta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Cuenta</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: Caja de Ahorro" 
                    className="bg-zinc-800 border-zinc-700"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="numeroCuenta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Cuenta</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: 012-345678/9" 
                    className="bg-zinc-800 border-zinc-700"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="titular"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titular</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Nombre del titular" 
                    className="bg-zinc-800 border-zinc-700"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cbu"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CBU / CVU (Opcional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="0000000000000000000000" 
                    className="bg-zinc-800 border-zinc-700"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="alias"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alias (Opcional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="mi.alias.mp" 
                    className="bg-zinc-800 border-zinc-700"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="activo"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-800 p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Cuenta Activa</FormLabel>
                <FormDescription>
                  Si está activa, los jugadores podrán verla para realizar pagos.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button 
            type="submit" 
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {initialData ? 'Actualizar Cuenta' : 'Guardar Cuenta'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
