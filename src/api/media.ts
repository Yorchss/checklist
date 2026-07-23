import { apiRequest } from "./client";

export const mediaApi = {
  /** Sube una foto de evidencia ya tomada/comprimida en el dispositivo. */
  subirEvidencia: (
    token: string,
    checklistId: string,
    itemId: string,
    blob: Blob
  ) =>
    apiRequest<{ blobPath: string }>(
      `/media/evidence/${checklistId}/${itemId}`,
      token,
      { method: "POST", body: blob, headers: { "Content-Type": blob.type } }
    ),
};

export const syncApi = {
  sincronizar: (token: string, checklists: unknown[]) =>
    apiRequest<{ resultados: { id: string; ok: boolean; error?: string }[] }>(
      "/sync/checklists",
      token,
      { method: "POST", body: JSON.stringify({ checklists }) }
    ),
};
