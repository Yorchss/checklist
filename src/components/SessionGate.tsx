import { PropsWithChildren, useEffect, useState } from "react";
import { useAuth } from "@/auth/useAuth";
import { sessionApi } from "@/api/session";
import { setSessionRevokedHandler } from "@/api/client";

type Estado = "verificando" | "conflicto" | "listo";

/**
 * Envuelve toda la app autenticada. Antes de dejar pasar al usuario:
 *  1. Pregunta al backend si ya hay una sesión activa en otro dispositivo.
 *  2. Si NO hay conflicto, reclama la sesión automáticamente y deja pasar.
 *  3. Si SÍ hay conflicto, muestra el diálogo de confirmación pedido por
 *     el cliente ("este usuario ya está logeado, ¿deseas cerrar esa
 *     sesión?") antes de decidir.
 *
 * También se suscribe al aviso global de "tu sesión fue cerrada en otro
 * dispositivo" — esto puede pasar en cualquier momento mientras se usa la
 * app (no solo al entrar), si alguien más inicia sesión después.
 */
export function SessionGate({ children }: PropsWithChildren) {
  const { getAccessToken, logout } = useAuth();
  const [estado, setEstado] = useState<Estado>("verificando");
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    verificarSesion();
    setSessionRevokedHandler(() => {
      alert("Tu sesión se cerró porque se inició sesión con esta cuenta en otro dispositivo.");
      logout();
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function verificarSesion() {
    try {
      const token = await getAccessToken();
      const { hayOtraSesionActiva } = await sessionApi.check(token);
      if (hayOtraSesionActiva) {
        setEstado("conflicto");
      } else {
        await sessionApi.claim(token);
        setEstado("listo");
      }
    } catch {
      // Si falla la verificación (ej. sin red en el primer load), dejamos
      // pasar — el resto de las llamadas a la API igual van a fallar de
      // forma visible si de verdad hay un problema de autenticación.
      setEstado("listo");
    }
  }

  async function cerrarOtraSesion() {
    setProcesando(true);
    try {
      const token = await getAccessToken();
      await sessionApi.claim(token);
      setEstado("listo");
    } finally {
      setProcesando(false);
    }
  }

  if (estado === "verificando") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-sm text-muted">Verificando sesión…</p>
      </div>
    );
  }

  if (estado === "conflicto") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary px-4">
        <div className="card w-full max-w-sm p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-regular-light">
            <span className="text-xl">⚠️</span>
          </div>
          <h1 className="text-lg font-bold text-ink">Este usuario ya está conectado</h1>
          <p className="mt-2 text-sm text-muted">
            Detectamos una sesión activa en otro dispositivo. ¿Deseas cerrar esa sesión e iniciar aquí?
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button onClick={cerrarOtraSesion} disabled={procesando} className="btn-primary w-full">
              {procesando ? "Cerrando la otra sesión…" : "Sí, cerrar esa sesión"}
            </button>
            <button onClick={() => logout()} className="btn-ghost w-full">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
