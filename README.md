# Frontend — App de Checklists Digitales

React + TypeScript + Vite. Diseñado para usarse en tablet/celular en campo, con soporte offline real.

## Stack

- **React 18 + TypeScript + Vite**
- **Tailwind CSS** — sistema de diseño en `tailwind.config.js` (paleta azul/blanco/verde)
- **MSAL React** — login contra Microsoft Entra External ID (Microsoft, Google o correo)
- **Dexie (IndexedDB)** — almacenamiento local para modo offline
- **React Router** — navegación

## Cómo correrlo

```bash
npm install
cp .env.example .env   # llena las variables, ver abajo
npm run dev
```

## Variables de entorno (`.env`)

| Variable | De dónde sale |
|---|---|
| `VITE_API_BASE_URL` | URL de tu Function App backend, con `/api` al final |
| `VITE_ENTRA_CLIENT_ID` | Portal de Entra External ID → App registrations → tu app SPA |
| `VITE_ENTRA_TENANT_SUBDOMAIN` | El `xyz` de `xyz.ciamlogin.com` |
| `VITE_ENTRA_TENANT_ID` | GUID del tenant de Entra External ID |
| `VITE_API_SCOPE` | El scope expuesto por la API registrada en Entra (`api://<client-id-api>/access_as_user`) |

## Estructura

```
src/
  auth/          # MSAL: configuración, provider, hook useAuth()
  api/           # clientes HTTP hacia cada módulo del backend
  offline/       # IndexedDB (Dexie), estado de conexión, motor de sincronización
  components/    # VerificationControl (control B/R/M/N-A), PhotoCapture, AppShell, SyncStatusBadge
  pages/         # Login, Dashboard, Nuevo checklist, Detalle, Plantillas, Constructor de plantilla
```

## Cómo funciona el modo offline (punto clave del proyecto)

1. Todo cambio en el formulario de checklist se guarda de inmediato en IndexedDB (`db.checklists.put(...)`), no solo en memoria de React — si se cierra la app a medio llenar, no se pierde nada.
2. Las fotos de evidencia se comprimen en el dispositivo (máx. 1600px, calidad ~72%) y se guardan como `Blob` en IndexedDB (`db.evidencias`), nunca se intentan subir directo.
3. `SyncStatusBadge` (visible en todo momento en el header) muestra cuántos checklists/fotos faltan por subir y dispara la sincronización automáticamente en cuanto el navegador detecta que volvió la conexión.
4. `syncEngine.sincronizarPendientes()` sube primero las fotos pendientes, luego los checklists — usando `POST /api/sync/checklists`, que es idempotente por diseño (el `id` del checklist se genera en el cliente con UUID desde el momento de creación).

## Sobre el módulo de plantillas desde foto (Document Intelligence)

`TemplateBuilderPage` nunca guarda el resultado de Document Intelligence directamente — lo muestra como formulario editable (nombre, tipo de verificación, opción de borrar items) para que un admin lo revise antes de confirmar. Esto es intencional: la heurística del backend que interpreta las tablas detectadas no es perfecta para cualquier formato, así que el punto de control humano es parte del diseño, no un parche.

## Pendiente para producción

- Code splitting (el warning del build sobre el chunk de 559kB es principalmente por MSAL — se puede resolver con `React.lazy()` en las rutas si el tamaño del bundle empieza a importar en conexiones lentas del patio).
- Service Worker para cachear los assets de la app misma (hoy el offline cubre los *datos*, no la carga inicial de la app si el navegador nunca la cacheó — considerar Workbox/`vite-plugin-pwa` como siguiente paso para que la app cargue incluso sin haber tenido internet nunca en ese dispositivo).
- Pantalla de administración de usuarios/licencias (falta conectar con el flujo de Stripe Checkout desde el frontend).
