import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, PenLine } from "lucide-react";
import { useAuth } from "@/auth/useAuth";
import { templatesApi } from "@/api/templates";
import { ChecklistTemplate } from "@/types";

export function TemplatesPage() {
  const { getAccessToken } = useAuth();
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getAccessToken()
      .then((token) => templatesApi.listar(token))
      .then((res) => setTemplates(res.items))
      .finally(() => setCargando(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Plantillas de checklist</h1>
        <div className="flex gap-2">
          <Link to="/plantillas/nueva-manual" className="btn-secondary">
            <PenLine size={16} /> Crear a mano
          </Link>
          <Link to="/plantillas/nueva" className="btn-primary">
            <Camera size={16} /> Crear desde foto
          </Link>
        </div>
      </div>

      {cargando && <p className="text-sm text-muted">Cargando…</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {templates.map((t) => (
          <div key={t.id} className="card p-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="font-semibold">{t.nombre}</span>
              {t.origen === "document-intelligence" && (
                <span className="rounded-full bg-primary-light px-2 py-0.5 text-[11px] font-semibold text-primary">
                  Generada de foto
                </span>
              )}
            </div>
            <p className="text-xs text-muted">
              {t.secciones.length} secciones · {t.secciones.reduce((acc, s) => acc + s.items.length, 0)} items
            </p>
          </div>
        ))}
      </div>

      {!cargando && templates.length === 0 && (
        <div className="card p-8 text-center text-muted">
          Todavía no hay plantillas. Sube una foto de tu checklist en papel para crear la primera.
        </div>
      )}
    </div>
  );
}
