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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Loader2,
  Save,
  Building2,
  CreditCard,
  User,
  Hash,
  Landmark,
} from 'lucide-react'

const formSchema = z.object({
  banco: z.string().min(1, 'El nombre del banco es requerido'),
  tipoCuenta: z.string().min(1, 'El tipo de cuenta es requerido'),
  numeroCuenta: z.string().min(1, 'El número de cuenta es requerido'),
  titular: z.string().min(1, 'El titular de la cuenta es requerido'),
  cbu: z.string().optional(),
  alias: z.string().optional(),
  activo: z.boolean(),
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

      toast.success(
        initialData ? 'Cuenta actualizada' : 'Cuenta creada correctamente',
      )
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Información principal */}
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="banco"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-300 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-500" />
                  Banco
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Banco Provincia"
                    className="bg-zinc-800/50 border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500/20 h-11"
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
                <FormLabel className="text-zinc-300 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-500" />
                  Tipo de Cuenta
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-zinc-800/50 border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500/20 h-11">
                      <SelectValue placeholder="Selecciona el tipo de cuenta" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="Caja de Ahorro">
                      Caja de Ahorro
                    </SelectItem>
                    <SelectItem value="Cuenta Corriente">
                      Cuenta Corriente
                    </SelectItem>
                    <SelectItem value="Cuenta Virtual">
                      Cuenta Virtual (CVU)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Datos del titular */}
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="numeroCuenta"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-300 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-emerald-500" />
                  Número de Cuenta
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: 012-345678/9"
                    className="bg-zinc-800/50 border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500/20 h-11 font-mono"
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
                <FormLabel className="text-zinc-300 flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-500" />
                  Titular
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nombre completo del titular"
                    className="bg-zinc-800/50 border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500/20 h-11"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* CBU y Alias */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-6 space-y-6">
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <Landmark className="h-4 w-4" />
            <span>Datos para transferencia (opcionales)</span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="cbu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">CBU / CVU</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="22 dígitos"
                      maxLength={22}
                      className="bg-zinc-900/50 border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500/20 h-11 font-mono tracking-wider"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-zinc-500 text-xs">
                    Código Bancario Uniforme de 22 dígitos
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="alias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">Alias</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="mi.alias.banco"
                      className="bg-zinc-900/50 border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500/20 h-11 font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-zinc-500 text-xs">
                    Alias alternativo para recibir transferencias
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="activo"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/30 p-5">
              <div className="space-y-1">
                <FormLabel className="text-base text-white">
                  Cuenta Activa
                </FormLabel>
                <FormDescription className="text-zinc-500">
                  Si está activa, los jugadores podrán verla para realizar
                  pagos.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4 border-t border-zinc-800">
          <Button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-600 text-white h-11 px-6"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {initialData ? 'Actualizar Cuenta' : 'Guardar Cuenta'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
