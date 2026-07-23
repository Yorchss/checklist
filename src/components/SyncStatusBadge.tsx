import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { db } from "@/offline/db";
import { useOnlineStatus } from "@/offline/useOnlineStatus";
import { sincronizarPendientes } from "@/offline/syncEngine";
import { useAuth } from "@/auth/useAuth";

/**
 * Indicador siempre visible de: (a) si hay conexión, y (b) cuántos
 * checklists/fotos faltan por subir. Es intencional que esto sea visible
 * todo el tiempo — un operador necesita confianza de que su trabajo no se
 * va a perder si se queda sin señal en el patio.
 */
export function SyncStatusBadge() {
  const online = useOnlineStatus();
  const { getAccessToken } = useAuth();
  const [sincronizando, setSincronizando] = useState(false);

  const pendientes = useLiveQuery(async () => {
    const checklists = await db.checklists.filter((c) => !!c.pendienteDeSync).count();
    const evidencias = await db.evidencias.filter((e) => !e.sincronizada).count();
    return checklists + evidencias;
  }, []);

  async function sincronizarAhora() {
    setSincronizando(true);
    try {
      await sincronizarPendientes(getAccessToken);
    } finally {
      setSincronizando(false);
    }
  }

  // Auto-sync cuando vuelve la conexión
  useEffect(() => {
    if (online) sincronizarAhora();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  const hayPendientes = (pendientes ?? 0) > 0;

  return (
    <button
      onClick={sincronizarAhora}
      disabled={!online || sincronizando}
      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition
        ${online ? "bg-bueno-light text-bueno" : "bg-regular-light text-regular"}
        ${!online ? "cursor-not-allowed" : "hover:opacity-80"}`}
      title={online ? "Sincronizar ahora" : "Sin conexión — se sincronizará automáticamente"}
    >
      <span className={`h-2 w-2 rounded-full ${online ? "bg-bueno" : "bg-regular"}`} />
      {sincronizando
        ? "Sincronizando…"
        : online
        ? hayPendientes
          ? `${pendientes} por subir`
          : "Todo sincronizado"
        : hayPendientes
        ? `${pendientes} guardado(s) localmente`
        : "Sin conexión"}
    </button>
  );
}
