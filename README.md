# Club Cuotas 🏆

Sistema de gestión de pagos y cuotas para equipos de fútbol.

## 🚀 Características

- **Gestión de Torneos**: Crea y administra múltiples torneos o competencias
- **Jugadores**: Registro y control de jugadores del equipo
- **Sistema de Cuotas**: Cuotas únicas, mensuales, de inscripción o extraordinarias
- **Flujo de Pagos**: Registro de pagos con aprobación por administrador
- **Mobile-First**: Diseño responsivo para uso en dispositivos móviles
- **Roles**: Administradores y Jugadores con permisos diferenciados

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 16 con App Router
- **Lenguaje**: TypeScript
- **Base de datos**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Autenticación**: Clerk
- **Estilos**: Tailwind CSS 4 + ShadCN UI
- **Validación**: Zod

## 📋 Requisitos Previos

- Node.js 20.17+ o 22.9+
- Cuenta en [Neon](https://neon.tech) para PostgreSQL
- Cuenta en [Clerk](https://clerk.com) para autenticación

## 🔧 Instalación

1. **Clona el repositorio**
```bash
git clone <repo-url>
cd club-cuotas
```

2. **Instala dependencias**
```bash
npm install
```

3. **Configura las variables de entorno**
```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:
```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

4. **Genera el cliente de Prisma**
```bash
npx prisma generate
```

5. **Ejecuta las migraciones**
```bash
npx prisma db push
```

6. **Inicia el servidor de desarrollo**
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
club-cuotas/
├── app/
│   ├── (auth)/                 # Páginas de autenticación
│   │   ├── iniciar-sesion/
│   │   └── registrarse/
│   ├── (dashboard)/            # Dashboard protegido
│   │   ├── admin/              # Panel de administrador
│   │   │   ├── torneos/
│   │   │   ├── jugadores/
│   │   │   ├── cuotas/
│   │   │   ├── pagos/
│   │   │   └── configuracion/
│   │   └── jugador/            # Panel de jugador
│   │       ├── pagos/
│   │       └── historial/
│   ├── layout.tsx
│   └── page.tsx                # Landing page
├── components/
│   ├── ui/                     # Componentes ShadCN
│   ├── forms/                  # Formularios
│   └── layouts/                # Layouts compartidos
├── lib/
│   ├── actions/                # Server Actions
│   ├── validations/            # Esquemas Zod
│   ├── db.ts                   # Cliente Prisma
│   └── utils.ts                # Utilidades
├── prisma/
│   └── schema.prisma           # Esquema de BD
└── types/
    └── index.ts                # Tipos TypeScript
```

## 👥 Roles de Usuario

### Administrador
- Dashboard con métricas y estadísticas
- Gestión completa de torneos, jugadores y cuotas
- Aprobación/rechazo de pagos
- Configuración de datos bancarios

### Jugador
- Visualización de cuotas pendientes
- Registro de pagos con comprobante
- Historial de pagos
- Datos bancarios para transferencia

## 🔐 Configuración de Clerk

1. Crea una aplicación en [Clerk Dashboard](https://dashboard.clerk.com)
2. Copia las claves en tu archivo `.env`
3. Configura las URLs de redirección:
   - Sign-in: `/iniciar-sesion`
   - Sign-up: `/registrarse`
   - After Sign-in/up: `/`

## 📊 Base de Datos

### Modelos Principales

- **Usuario**: Datos del usuario sincronizados con Clerk
- **Jugador**: Perfil de jugador con datos adicionales
- **Torneo**: Competencias y torneos
- **Cuota**: Cuotas definidas por torneo
- **CuotaJugador**: Asignación de cuotas a jugadores
- **Pago**: Registro de pagos realizados
- **ConfiguracionBancaria**: Datos de cuentas bancarias

## 🚀 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Despliega automáticamente

### Variables de Entorno Requeridas

```
DATABASE_URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
```

## Script reiniciar base de datos
```
npx prisma db execute --file .\reset_db.sql`
```

## 📝 Licencia

MIT License - Usa este proyecto libremente.
