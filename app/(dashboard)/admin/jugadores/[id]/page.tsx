// Página de detalle/edición de jugador

import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shirt,
  MapPin,
  Trophy,
  CreditCard,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PaginaDetalleJugador({ params }: PageProps) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/iniciar-sesion");
  }

  const usuario = await db.usuario.findUnique({
    where: { id: userId },
  });

  if (usuario?.rol !== "ADMINISTRADOR") {
    redirect("/jugador");
  }

  // Obtener jugador con todos sus datos
  const jugador = await db.jugador.findUnique({
    where: { id },
    include: {
      usuarios: {
        select: {
          id: true,
          nombreCompleto: true,
          email: true,
          activo: true,
        },
      },
      inscripciones: {
        include: {
          torneo: true,
        },
      },
      cuotasAsignadas: {
        include: {
          cuota: {
            include: { torneo: true },
          },
          pagos: true,
        },
        orderBy: {
          cuota: { fechaVencimiento: "desc" },
        },
      },
    },
  });

  if (!jugador) {
    notFound();
  }

  const cuotasPendientes = jugador.cuotasAsignadas.filter(
    (cj) => cj.estadoPago === "PENDIENTE" || cj.estadoPago === "PARCIAL"
  );
  const cuotasPagadas = jugador.cuotasAsignadas.filter(
    (cj) => cj.estadoPago === "PAGADO"
  );

  const totalPendiente = cuotasPendientes.reduce((sum, cj) => {
    const monto =
      cj.montoPersonalizado?.toNumber() || cj.cuota.monto.toNumber();
    const pagado = cj.pagos
      .filter((p) => p.estado === "APROBADO")
      .reduce((s, p) => s + p.monto.toNumber(), 0);
    return sum + (monto - pagado);
  }, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            asChild
            className="border-zinc-700"
          >
            <Link href="/admin/jugadores">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{jugador.nombre}</h1>
            <p className="text-zinc-400 mt-1">
              {jugador.posicion || "Sin posición asignada"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            asChild
            className="border-zinc-700 text-zinc-300"
          >
            <Link href={`/admin/jugadores/${jugador.id}/editar`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <Badge
            variant="outline"
            className={
              jugador.usuarios.length > 0
                ? "border-emerald-500/30 text-emerald-400"
                : "border-zinc-600 text-zinc-400"
            }
          >
            {jugador.usuarios.length > 0
              ? `${jugador.usuarios.length} usuario(s) asociado(s)`
              : "Sin usuarios asociados"}
          </Badge>
        </div>
      </div>

      {/* Información del jugador */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Datos personales */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-400" />
              Datos personales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {jugador.cuit && (
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-zinc-500" />
                <span className="text-zinc-300">CUIT: {jugador.cuit}</span>
              </div>
            )}
            {jugador.usuarios.map((usr) => (
              <div key={usr.id} className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-zinc-500" />
                <span className="text-zinc-300">
                  {usr.email}{" "}
                  <span className="text-zinc-500 text-xs">
                    ({usr.nombreCompleto})
                  </span>
                </span>
              </div>
            ))}
            {jugador.telefono && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-zinc-500" />
                <span className="text-zinc-300">{jugador.telefono}</span>
              </div>
            )}
            {jugador.fechaNacimiento && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-zinc-500" />
                <span className="text-zinc-300">
                  {format(jugador.fechaNacimiento, "d 'de' MMMM, yyyy", {
                    locale: es,
                  })}
                </span>
              </div>
            )}
            {jugador.posicion && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-zinc-500" />
                <span className="text-zinc-300">{jugador.posicion}</span>
              </div>
            )}
            {jugador.numeroCamiseta && (
              <div className="flex items-center gap-3">
                <Shirt className="h-4 w-4 text-zinc-500" />
                <span className="text-zinc-300">
                  Camiseta #{jugador.numeroCamiseta}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen de cuotas */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-400" />
              Resumen de cuotas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-center p-4 rounded-xl bg-zinc-800/50">
                <Clock className="h-6 w-6 text-amber-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {cuotasPendientes.length}
                </p>
                <p className="text-xs text-zinc-500">Pendientes</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-zinc-800/50">
                <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {cuotasPagadas.length}
                </p>
                <p className="text-xs text-zinc-500">Pagadas</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-zinc-800/50">
                <AlertTriangle className="h-6 w-6 text-red-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  ${totalPendiente.toLocaleString("es-AR")}
                </p>
                <p className="text-xs text-zinc-500">Deuda total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Torneos inscritos */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-emerald-400" />
            Torneos inscritos
          </CardTitle>
          <CardDescription>
            Competencias en las que participa el jugador
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jugador.inscripciones.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">
              No está inscrito en ningún torneo
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {jugador.inscripciones.map((inscripcion) => (
                <div
                  key={inscripcion.id}
                  className="p-4 rounded-xl border border-zinc-700 bg-zinc-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {inscripcion.torneo.nombre}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Inscrito:{" "}
                        {format(inscripcion.fechaInscripcion, "dd/MM/yyyy")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cuotas pendientes */}
      {cuotasPendientes.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Cuotas pendientes</CardTitle>
            <CardDescription>
              Cuotas que el jugador aún no ha pagado completamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cuotasPendientes.map((cj) => {
                const monto =
                  cj.montoPersonalizado?.toNumber() ||
                  cj.cuota.monto.toNumber();
                const pagado = cj.pagos
                  .filter((p) => p.estado === "APROBADO")
                  .reduce((s, p) => s + p.monto.toNumber(), 0);
                const pendiente = monto - pagado;

                return (
                  <div
                    key={cj.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-zinc-700 bg-zinc-800/50"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {cj.cuota.nombre}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {cj.cuota.torneo.nombre}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        Vence:{" "}
                        {format(cj.cuota.fechaVencimiento, "d 'de' MMMM", {
                          locale: es,
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-amber-400">
                        ${pendiente.toLocaleString("es-AR")}
                      </p>
                      {pagado > 0 && (
                        <p className="text-xs text-zinc-500">
                          Pagado: ${pagado.toLocaleString("es-AR")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
