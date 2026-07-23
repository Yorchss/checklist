import { PropsWithChildren, useMemo } from "react";
import { PublicClientApplication, EventType } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./msalConfig";

/**
 * Envuelve la app con el contexto de MSAL. Se crea una sola instancia del
 * PublicClientApplication (recomendación oficial de MSAL — crearla dentro
 * del componente en cada render causaría relogins innecesarios).
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const msalInstance = useMemo(() => {
    const instance = new PublicClientApplication(msalConfig);

    instance.addEventCallback((event) => {
      if (
        (event.eventType === EventType.LOGIN_SUCCESS ||
          event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) &&
        event.payload &&
        "account" in event.payload &&
        event.payload.account
      ) {
        instance.setActiveAccount(event.payload.account);
      }
    });

    return instance;
  }, []);

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}
