import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { apiRequest, loginRequest } from "./msalConfig";

/**
 * Hook central de autenticación. Expone login/logout y, sobre todo,
 * getAccessToken() — que es lo que usa el cliente de la API en cada
 * request para armar el header Authorization: Bearer <token>.
 */
export function useAuth() {
  const { instance, accounts } = useMsal();
  const account = accounts[0];

  async function login() {
    await instance.loginRedirect(loginRequest);
  }

  async function logout() {
    await instance.logoutRedirect();
  }

  async function getAccessToken(): Promise<string> {
    if (!account) throw new Error("No hay sesión activa");

    try {
      const result = await instance.acquireTokenSilent({
        ...apiRequest,
        account,
      });
      return result.accessToken;
    } catch (err) {
      // El token silencioso falla típicamente cuando expiró la sesión o se
      // requiere re-consentimiento — se resuelve con un redirect interactivo.
      if (err instanceof InteractionRequiredAuthError) {
        await instance.acquireTokenRedirect(apiRequest);
      }
      throw err;
    }
  }

  return {
    isAuthenticated: !!account,
    account,
    nombre: account?.name || account?.username || "",
    login,
    logout,
    getAccessToken,
  };
}
