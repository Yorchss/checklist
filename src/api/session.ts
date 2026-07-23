import { apiRequest } from "./client";

export const sessionApi = {
  check: (token: string) =>
    apiRequest<{ hayOtraSesionActiva: boolean }>("/auth/session/check", token),

  claim: (token: string) =>
    apiRequest<{ reclamada: boolean }>("/auth/session/claim", token, { method: "POST" }),
};
