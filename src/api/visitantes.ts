import { apiRequest } from "./client";

export interface Visitante {
  id: string;
  nombre: string;
  empresa: string;
  telefono: string;
  fotoBlobPath?: string;
  fotoUrl?: string | null;
  creadoEn: string;
}

export const visitantesApi = {
  subirFoto: (token: string, blob: Blob) =>
    apiRequest<{ blobPath: string }>("/visitantes/photo", token, {
      method: "POST",
      body: blob,
      headers: { "Content-Type": blob.type },
    }),

  crear: (token: string, datos: { nombre: string; empresa: string; telefono: string; fotoBlobPath?: string }) =>
    apiRequest<Visitante>("/visitantes", token, {
      method: "POST",
      body: JSON.stringify(datos),
    }),

  listar: (token: string) =>
    apiRequest<{ items: Visitante[] }>("/visitantes", token),
};
