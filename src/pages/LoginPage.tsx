import { useAuth } from "@/auth/useAuth";

/**
 * Pantalla de login. El botón dispara loginRedirect(), que manda al usuario
 * al user flow de Entra External ID — ahí es donde elige Microsoft, Google
 * o correo/contraseña. La app no implementa esos 3 flujos por separado;
 * Entra ya resuelve esa pantalla de selección.
 */
export function LoginPage() {
  const { login } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-4">
      <div className="card w-full max-w-sm p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light">
          <span className="font-display text-xl font-bold text-primary">✓</span>
        </div>
        <h1 className="text-xl font-bold text-ink">Checklist de inspección</h1>
        <p className="mt-2 text-sm text-muted">
          Digitaliza los checklists de tus unidades y genera el PDF listo para auditoría.
        </p>
        <button onClick={login} className="btn-primary mt-6 w-full">
          Iniciar sesión
        </button>
        <p className="mt-4 text-xs text-muted">
          Con tu cuenta de Microsoft, Google o correo electrónico
        </p>
      </div>
    </div>
  );
}
