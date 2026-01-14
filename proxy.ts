// Middleware de autenticación con Clerk
// Protege rutas según el rol del usuario

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Rutas públicas que no requieren autenticación
const rutasPublicas = createRouteMatcher([
  '/',
  '/iniciar-sesion(.*)',
  '/registrarse(.*)',
  '/api/webhooks(.*)',
])

// Rutas exclusivas para administradores
const rutasAdmin = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // Rutas públicas no requieren verificación
  if (rutasPublicas(req)) {
    return
  }

  // Todas las demás rutas requieren autenticación
  await auth.protect()
})

export const config = {
  matcher: [
    // Excluir archivos estáticos y rutas internas de Next.js
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Siempre incluir rutas de API
    '/(api|trpc)(.*)',
  ],
}
