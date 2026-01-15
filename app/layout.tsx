// Layout raíz de la aplicación
// Configura Clerk, fuentes y proveedores globales

import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { esES } from '@clerk/localizations'
import { Toaster } from '@/components/ui/sonner'
import { ProgressBarProvider } from '@/components/providers/progress-bar-provider'
import './globals.css'

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Club Cuotas - Gestión de Pagos',
    template: '%s | Club Cuotas',
  },
  description:
    'Sistema de gestión de pagos y cuotas para equipos de fútbol. Administra torneos, jugadores y pagos de forma sencilla.',
  keywords: ['fútbol', 'cuotas', 'pagos', 'equipo', 'torneo', 'gestión'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider localization={esES}>
      <html lang="es" suppressHydrationWarning>
        <body className={`${outfit.variable} font-sans antialiased`}>
          <ProgressBarProvider>
            {children}
          </ProgressBarProvider>
          <Toaster position="top-right" richColors />
        </body>
      </html>
    </ClerkProvider>
  )
}
