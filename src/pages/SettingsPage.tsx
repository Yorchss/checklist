import { useEffect, useState } from "react";
import { useAuth } from "@/auth/useAuth";
import { tenantApi } from "@/api/tenant";

/**
 * Configuración de la empresa. Por ahora, un solo campo con valor real:
 * los correos que reciben el PDF automáticamente cuando un checklist se
 * envía sin especificar destinatarios (ver submitChecklist en el backend).
 */
export function SettingsPage() {
  const { getAccessToken } = useAuth();
  const [nombre, setNombre] = useState("");
  const [correos, setCorreos] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    getAccessToken()
      .then((token) => tenantApi.obtenerConfiguracion(token))
      .then((config) => {
        setNombre(config.nombre || "");
        setCorreos((config.correosNotificacionDefault || []).join(", "));
      })
      .finally(() => setCargando(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function guardar() {
    setGuardando(true);
    setMensaje("");
    try {
      const token = await getAccessToken();
      const listaCorreos = correos
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      await tenantApi.actualizarConfiguracion(token, {
        nombre,
        correosNotificacionDefault: listaCorreos,
      });
      setMensaje("Configuración guardada.");
    } catch {
      setMensaje("No se pudo guardar. Solo un administrador puede editar esta sección.");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <p className="text-sm text-muted">Cargando…</p>;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-2xl font-bold">Configuración</h1>
      <p className="mb-5 text-sm text-muted">Ajustes generales de tu empresa.</p>

      <div className="card p-6">
        <label className="mb-1 block text-sm font-medium">Nombre de la empresa</label>
        <input className="input mb-4" value={nombre} onChange={(e) => setNombre(e.target.value)} />

        <label className="mb-1 block text-sm font-medium">Correos de notificación por default</label>
        <textarea
          className="input"
          rows={2}
          placeholder="correo1@empresa.com, correo2@empresa.com"
          value={correos}
          onChange={(e) => setCorreos(e.target.value)}
        />
        <p className="mt-1 text-xs text-muted">
          Estos correos reciben automáticamente el PDF cuando alguien envía un checklist sin elegir destinatarios a mano. Sepáralos con comas.
        </p>

        <button onClick={guardar} disabled={guardando} className="btn-primary mt-5 w-full">
          {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
        {mensaje && <p className="mt-3 text-sm text-muted">{mensaje}</p>}
      </div>
    </div>
  );
}
