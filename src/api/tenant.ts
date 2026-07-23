import { apiRequest } from "./client";

export interface TenantSettings {
  id: string;
  nombre: string;
  emailContacto: string;
  correosNotificacionDefault?: string[];
}

export const tenantApi = {
  obtenerConfiguracion: (token: string) =>
    apiRequest<TenantSettings>("/tenant/settings", token),

  actualizarConfiguracion: (
    token: string,
    cambios: { nombre?: string; correosNotificacionDefault?: string[] }
  ) =>
    apiRequest<TenantSettings>("/tenant/settings", token, {
      method: "PUT",
      body: JSON.stringify(cambios),
    }),
};
