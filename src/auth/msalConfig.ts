import { Configuration, LogLevel } from "@azure/msal-browser";

/**
 * Configuración de Microsoft Entra External ID (CIAM).
 * El "user flow" configurado en el portal de Entra ya resuelve las 3 formas
 * de login que pidió el cliente (cuenta Microsoft, Google, correo/contraseña)
 * — desde el frontend solo se ve como un único flujo de autenticación.
 *
 * Variables de entorno esperadas (ver .env.example):
 *  VITE_ENTRA_CLIENT_ID
 *  VITE_ENTRA_TENANT_SUBDOMAIN   (el "xyz" de xyz.ciamlogin.com)
 *  VITE_ENTRA_TENANT_ID
 *  VITE_API_SCOPE                (ej. api://<client-id-api>/access_as_user)
 *  VITE_API_BASE_URL
 */

const tenantSubdomain = import.meta.env.VITE_ENTRA_TENANT_SUBDOMAIN;
const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID;

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_ENTRA_CLIENT_ID,
    authority: `https://${tenantSubdomain}.ciamlogin.com/${tenantId}`,
    knownAuthorities: [`${tenantSubdomain}.ciamlogin.com`],
    redirectUri: "/",
    postLogoutRedirectUri: "/",
  },
  cache: {
    // localStorage (no sessionStorage) para que la sesión sobreviva si el
    // usuario cierra la app mientras está offline en el patio y la vuelve
    // a abrir más tarde sin señal.
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        if (level === LogLevel.Error) console.error(message);
      },
    },
  },
};

/** Scope de la API propia — se pide junto con el login para ya traer un access token usable contra el backend. */
export const apiRequest = {
  scopes: [import.meta.env.VITE_API_SCOPE],
};

export const loginRequest = {
  scopes: ["openid", "profile", import.meta.env.VITE_API_SCOPE],
};
