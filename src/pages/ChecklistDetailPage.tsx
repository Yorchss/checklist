import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";
import { useOnlineStatus } from "@/offline/useOnlineStatus";
import { db } from "@/offline/db";
import { checklistsApi } from "@/api/checklists";
import { ChecklistInstance } from "@/types";

export function ChecklistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getAccessToken } = useAuth();
  const online = useOnlineStatus();
  const [checklist, setChecklist] = useState<ChecklistInstance | null>(null);
  const [destinatarios, setDestinatarios] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!id) return;
    db.checklists.get(id).then((local) => local && setChecklist(local));
    if (online) {
      getAccessToken()
        .then((token) => checklistsApi.obtener(token, id))
        .then(setChecklist)
        .catch(() => {});
    }
  }, [id, online]); // eslint-disable-line react-hooks/exhaustive-deps

  async function reenviar() {
    if (!id || !destinatarios.trim()) return;
    setEnviando(true);
    setMensaje("");
    try {
      const token = await getAccessToken();
      await checklistsApi.enviar(
        token,
        id,
        destinatarios.split(",").map((e) => e.trim())
      );
      setMensaje("Checklist enviado por correo.");
    } catch {
      setMensaje("No se pudo enviar. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  if (!checklist) return <p className="text-sm text-muted">Cargando…</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/" className="mb-4 inline-block text-sm text-primary">
        ← Volver
      </Link>
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">
            {checklist.vehiculo.marca} {checklist.vehiculo.modelo}
          </h1>
          <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
            {checklist.status}
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted">Fecha</dt>
            <dd className="font-mono">{checklist.fechaChecklist}</dd>
          </div>
          <div>
            <dt className="text-muted">Responsable</dt>
            <dd>{checklist.responsable.nombre || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Km inicio / fin</dt>
            <dd className="font-mono">
              {checklist.vehiculo.kilometrajeInicio || "—"} / {checklist.vehiculo.kilometrajeFin || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Items capturados</dt>
            <dd>{checklist.respuestas.length}</dd>
          </div>
        </dl>

        {checklist.pdfUrl && (
          <a href={checklist.pdfUrl} target="_blank" rel="noreferrer" className="btn-primary mt-5 w-full">
            Descargar PDF
          </a>
        )}

        {!checklist.pdfUrl && checklist.pendienteDeSync && (
          <p className="mt-5 rounded-xl bg-regular-light p-3 text-sm text-regular">
            Este checklist todavía no se ha sincronizado. El PDF se genera automáticamente cuando vuelva la conexión.
          </p>
        )}

        {checklist.pdfUrl && (
          <div className="mt-5 border-t border-black/5 pt-4">
            <label className="mb-1 block text-sm font-medium">Reenviar por correo</label>
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="correo1@empresa.com, correo2@empresa.com"
                value={destinatarios}
                onChange={(e) => setDestinatarios(e.target.value)}
              />
              <button onClick={reenviar} disabled={enviando} className="btn-secondary shrink-0">
                {enviando ? "Enviando…" : "Enviar"}
              </button>
            </div>
            {mensaje && <p className="mt-2 text-xs text-muted">{mensaje}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
