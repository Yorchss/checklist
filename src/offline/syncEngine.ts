import { db } from "./db";
import { syncApi, mediaApi } from "@/api/media";

/**
 * Motor de sincronización. Se dispara:
 *  1. Automáticamente cuando el navegador vuelve a estar online (ver App.tsx)
 *  2. Manualmente si el usuario le da a "Sincronizar ahora"
 *  3. Periódicamente (cada 2 min) mientras hay conexión, por si el evento
 *     "online" del navegador no se disparó de forma confiable (pasa en
 *     algunas tablets Android con el WebView)
 *
 * Orden importante: primero suben las evidencias (fotos) pendientes, luego
 * los checklists — así el checklist que se sincroniza ya trae las
 * referencias de blob de sus fotos resueltas.
 */
export async function sincronizarPendientes(
  getAccessToken: () => Promise<string>
): Promise<{ checklistsSincronizados: number; erroresCount: number }> {
  const token = await getAccessToken();

  // 1. Subir evidencias fotográficas pendientes
  // Nota: se filtra con .filter() en vez de .where().equals() porque
  // IndexedDB no maneja de forma confiable "boolean" como tipo de índice
  // en todos los navegadores/WebViews.
  const evidenciasPendientes = await db.evidencias
    .filter((e) => !e.sincronizada)
    .toArray();

  for (const evidencia of evidenciasPendientes) {
    try {
      await mediaApi.subirEvidencia(
        token,
        evidencia.checklistId,
        evidencia.itemId,
        evidencia.blob
      );
      await db.evidencias.update(evidencia.id!, { sincronizada: true });
    } catch {
      // se reintenta en la siguiente pasada de sync; no se detiene el resto del lote
      continue;
    }
  }

  // 2. Subir checklists marcados como pendientes
  const checklistsPendientes = await db.checklists
    .filter((c) => !!c.pendienteDeSync)
    .toArray();

  if (checklistsPendientes.length === 0) {
    return { checklistsSincronizados: 0, erroresCount: 0 };
  }

  const { resultados } = await syncApi.sincronizar(token, checklistsPendientes);

  let exitosos = 0;
  let errores = 0;
  for (const resultado of resultados) {
    if (resultado.ok) {
      await db.checklists.update(resultado.id, { pendienteDeSync: false });
      exitosos++;
    } else {
      errores++;
    }
  }

  return { checklistsSincronizados: exitosos, erroresCount: errores };
}
