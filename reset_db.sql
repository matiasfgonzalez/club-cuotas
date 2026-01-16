-- ==============================================================================
-- SCRIPT DE REINICIO TOTAL DE BASE DE DATOS
-- Este script elimina ABSOLUTAMENTE TODOS los datos, incluyendo usuarios.
-- ==============================================================================

-- 1. Eliminar datos transaccionales (Ordenados por dependencia)
TRUNCATE TABLE "Pago" CASCADE;
TRUNCATE TABLE "CuotaJugador" CASCADE;
TRUNCATE TABLE "InscripcionTorneo" CASCADE;

-- 2. Eliminar definiciones maestras
TRUNCATE TABLE "Cuota" CASCADE;
TRUNCATE TABLE "Torneo" CASCADE;
TRUNCATE TABLE "Jugador" CASCADE;
TRUNCATE TABLE "ConfiguracionBancaria" CASCADE;

-- 3. Eliminar Usuarios
-- ADVERTENCIA: Esto eliminará todos los usuarios registrados.
-- Deberás registrarte nuevamente y asignar el rol de ADMINISTRADOR manualmente
-- en la base de datos para recuperar acceso al panel de control.
TRUNCATE TABLE "Usuario" CASCADE;

-- ==============================================================================
-- Fin del script
-- ==============================================================================
