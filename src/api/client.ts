const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * Se registra una sola vez (ver SessionGate.tsx) para poder reaccionar
 * desde cualquier llamada a la API sin acoplar este módulo a React/MSAL.
 * Cuando el backend rechaza un request porque la sesión se cerró en otro
 * dispositivo (ver enforceActiveSession en el backend), este callback se
 * dispara para forzar el logout y avisarle al usuario.
 */
let onSessionRevoked: (() => void) | null = null;
export function setSessionRevokedHandler(fn: () => void) {
  onSessionRevoked = fn;
}

/**
 * Wrapper delgado sobre fetch. Recibe el access token como parámetro (en
 * vez de leerlo internamente) para no atar este módulo a React/MSAL — así
 * se puede reusar igual desde un service worker si más adelante se necesita.
 */
export async function apiRequest<T>(
  path: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${accessToken}`,
      ...(options.body && !(options.body instanceof ArrayBuffer) && !(options.body instanceof Blob)
        ? { "Content-Type": "application/json" }
        : {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    if (body.code === "SESSION_REVOKED") {
      onSessionRevoked?.();
    }
    throw new ApiError(response.status, body.error || "Error de la API", body.code);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}
