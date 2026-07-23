import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { PlusCircle } from "lucide-react";
import { useAuth } from "@/auth/useAuth";
import { db } from "@/offline/db";
import { useOnlineStatus } from "@/offline/useOnlineStatus";
import { checklistsApi } from "@/api/checklists";
import { statsApi } from "@/api/stats";
import { ChecklistInstance } from "@/types";

const STATUS_CLASES: Record<string, string> = {
  borrador: "bg-regular-light text-regular",
  enviado: "bg-bueno-light text-bueno",
  archivado: "bg-black/5 text-muted",
};

/**
 * Lista de checklists — pensada como el punto de partida para auditorías:
 * filtro por rango de fecha y status. Combina lo que hay en IndexedDB local
 * (incluye borradores offline que ni siquiera han llegado al servidor) con
 * lo que trae el backend cuando hay conexión.
 */
export function DashboardPage() {
  const { getAccessToken } = useAuth();
  const online = useOnlineStatus();
  const [remotos, setRemotos] = useState<ChecklistInstance[]>([]);
  const [cargando, setCargando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [hoyCantidad, setHoyCantidad] = useState<number | null>(null);

  const locales = useLiveQuery(() => db.checklists.toArray(), []) || [];

  useEffect(() => {
    if (!online) return;
    const hoy = new Date().toISOString().slice(0, 10);
    getAccessToken()
      .then((token) => statsApi.checklists(token, hoy, hoy))
      .then((res) => setHoyCantidad(res.total))
      .catch(() => {});
  }, [online]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!online) return;
    setCargando(true);
    getAccessToken()
      .then((token) => checklistsApi.listar(token, { status: filtroStatus || undefined }))
      .then((res) => setRemotos(res.items))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [online, filtroStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Combina: prioriza la copia local si un checklist existe en ambos lados
  // (la local es la más reciente si el usuario lo editó offline)
  const combinados = new Map<string, ChecklistInstance>();
  for (const c of remotos) combinados.set(c.id, c);
  for (const c of locales) combinados.set(c.id, c);
  let lista = Array.from(combinados.values()).sort((a, b) =>
    b.fechaChecklist.localeCompare(a.fechaChecklist)
  );
  if (filtroStatus) lista = lista.filter((c) => c.status === filtroStatus);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Checklists</h1>
        <Link to="/nuevo" className="btn-primary">
          <PlusCircle size={16} /> Nuevo checklist
        </Link>
      </div>

      {hoyCantidad !== null && (
        <div className="card mb-5 flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs text-muted">Camiones revisados hoy</p>
            <p className="font-display text-3xl font-bold text-primary">{hoyCantidad}</p>
          </div>
          <Link to="/estadisticas" className="text-sm font-semibold text-primary hover:underline">
            Ver estadísticas →
          </Link>
        </div>
      )}

      <div className="mb-4 flex gap-2">
        {["", "borrador", "enviado", "archivado"].map((s) => (
          <button
            key={s || "todos"}
            onClick={() => setFiltroStatus(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              filtroStatus === s ? "bg-primary text-white" : "bg-white text-muted border border-black/10"
            }`}
          >
            {s ? s[0].toUpperCase() + s.slice(1) : "Todos"}
          </button>
        ))}
      </div>

      {cargando && <p className="text-sm text-muted">Cargando…</p>}

      {!cargando && lista.length === 0 && (
        <div className="card p-8 text-center text-muted">
          Aún no hay checklists. Crea el primero con "+ Nuevo checklist".
        </div>
      )}

      <div className="grid gap-3">
        {lista.map((checklist) => (
          <Link
            key={checklist.id}
            to={`/checklists/${checklist.id}`}
            className="card flex items-center justify-between p-4 hover:border-primary/30"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {checklist.vehiculo.marca || "Sin marca"} {checklist.vehiculo.modelo || ""}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_CLASES[checklist.status]}`}>
                  {checklist.status}
                </span>
                {checklist.pendienteDeSync && (
                  <span className="rounded-full bg-regular-light px-2 py-0.5 text-[11px] font-semibold text-regular">
                    Sin subir
                  </span>
                )}
              </div>
              <div className="mt-1 font-mono text-xs text-muted">{checklist.fechaChecklist}</div>
            </div>
            <span className="text-muted">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
