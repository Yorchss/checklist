import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useLiveQuery } from "dexie-react-hooks";
import { useAuth } from "@/auth/useAuth";
import { useOnlineStatus } from "@/offline/useOnlineStatus";
import { db } from "@/offline/db";
import { templatesApi } from "@/api/templates";
import { checklistsApi } from "@/api/checklists";
import { VerificationControl } from "@/components/VerificationControl";
import { PhotoCapture } from "@/components/PhotoCapture";
import { ChecklistInstance, ChecklistTemplate } from "@/types";

/**
 * Formulario de captura. Es "offline-first" de verdad: cada cambio se
 * guarda inmediatamente en IndexedDB (no solo en memoria de React), así que
 * si la tablet se queda sin batería o se cierra la pestaña a medio llenar,
 * no se pierde nada — al volver a entrar retoma el mismo borrador.
 */
export function NewChecklistPage() {
  const navigate = useNavigate();
  const { getAccessToken, account } = useAuth();
  const online = useOnlineStatus();

  const [templateId, setTemplateId] = useState<string>("");
  const [checklistId] = useState(() => uuidv4());
  const [template, setTemplate] = useState<ChecklistTemplate | null>(null);
  const [guardando, setGuardando] = useState(false);

  const plantillasLocales = useLiveQuery(() => db.templates.toArray(), []) || [];
  const checklistLocal = useLiveQuery(() => db.checklists.get(checklistId), [checklistId]);
  const fotosPorItem = useLiveQuery(
    () => db.evidencias.where("checklistId").equals(checklistId).toArray(),
    [checklistId]
  );

  // Descarga y cachea las plantillas del tenant la primera vez que hay conexión,
  // para que después estén disponibles aunque se pierda internet.
  useEffect(() => {
    if (!online) return;
    getAccessToken()
      .then((token) => templatesApi.listar(token))
      .then((res) => db.templates.bulkPut(res.items))
      .catch(() => {});
  }, [online]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!templateId) return;
    db.templates.get(templateId).then((t) => t && setTemplate(t));
  }, [templateId]);

  function checklistBase(): ChecklistInstance {
    const ahora = new Date().toISOString();
    return (
      checklistLocal || {
        id: checklistId,
        tenantId: "", // se resuelve en el backend a partir del token; se sobreescribe en sync
        templateId,
        creadoPor: account?.localAccountId || "",
        vehiculo: {},
        responsable: { nombre: "" },
        respuestas: [],
        status: "borrador",
        creadoEn: ahora,
        actualizadoEn: ahora,
        fechaChecklist: ahora.slice(0, 10),
        pendienteDeSync: true,
      }
    );
  }

  async function guardarLocal(cambios: Partial<ChecklistInstance>) {
    const actualizado: ChecklistInstance = {
      ...checklistBase(),
      ...cambios,
      templateId: templateId || checklistBase().templateId,
      actualizadoEn: new Date().toISOString(),
      pendienteDeSync: true,
    };
    await db.checklists.put(actualizado);
  }

  function setRespuesta(itemId: string, valor: string) {
    const respuestas = [...(checklistLocal?.respuestas || [])];
    const idx = respuestas.findIndex((r) => r.itemId === itemId);
    if (idx >= 0) respuestas[idx] = { ...respuestas[idx], valor };
    else respuestas.push({ itemId, valor });
    guardarLocal({ respuestas });
  }

  async function enviar() {
    setGuardando(true);
    try {
      await guardarLocal({ status: "borrador" }); // asegura que quede guardado antes de intentar mandar

      if (online) {
        const token = await getAccessToken();
        await checklistsApi.crear(token, { ...checklistLocal, id: checklistId });
        await checklistsApi.enviar(token, checklistId, []);
        await db.checklists.update(checklistId, { pendienteDeSync: false, status: "enviado" });
      }
      // Si no hay conexión, se queda guardado local con pendienteDeSync=true
      // y el syncEngine lo sube (y lo manda a submit) en cuanto vuelva la señal.
      navigate(`/checklists/${checklistId}`);
    } finally {
      setGuardando(false);
    }
  }

  if (!templateId) {
    return (
      <div className="mx-auto max-w-lg">
        <h1 className="mb-4 text-2xl font-bold">Nuevo checklist</h1>
        <p className="mb-3 text-sm text-muted">Elige la plantilla a usar:</p>
        <div className="grid gap-2">
          {plantillasLocales.map((t) => (
            <button key={t.id} onClick={() => setTemplateId(t.id)} className="card p-4 text-left hover:border-primary/30">
              <div className="font-semibold">{t.nombre}</div>
              <div className="text-xs text-muted">{t.secciones.length} secciones</div>
            </button>
          ))}
          {plantillasLocales.length === 0 && (
            <p className="text-sm text-muted">
              No hay plantillas descargadas todavía. Conéctate a internet una vez para sincronizarlas.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!template) return <p className="text-sm text-muted">Cargando plantilla…</p>;

  return (
    <div className="mx-auto max-w-3xl pb-24">
      <h1 className="mb-1 text-2xl font-bold">{template.nombre}</h1>
      <p className="mb-5 text-sm text-muted">Se guarda automáticamente mientras llenas el formulario.</p>

      <div className="card mb-4 grid grid-cols-2 gap-3 p-4">
        <input
          placeholder="Marca"
          className="input"
          defaultValue={checklistLocal?.vehiculo.marca}
          onBlur={(e) => guardarLocal({ vehiculo: { ...checklistLocal?.vehiculo, marca: e.target.value } })}
        />
        <input
          placeholder="Modelo"
          className="input"
          defaultValue={checklistLocal?.vehiculo.modelo}
          onBlur={(e) => guardarLocal({ vehiculo: { ...checklistLocal?.vehiculo, modelo: e.target.value } })}
        />
        <input
          placeholder="Kilometraje inicio"
          className="input font-mono"
          defaultValue={checklistLocal?.vehiculo.kilometrajeInicio}
          onBlur={(e) =>
            guardarLocal({ vehiculo: { ...checklistLocal?.vehiculo, kilometrajeInicio: e.target.value } })
          }
        />
        <input
          placeholder="Kilometraje fin"
          className="input font-mono"
          defaultValue={checklistLocal?.vehiculo.kilometrajeFin}
          onBlur={(e) =>
            guardarLocal({ vehiculo: { ...checklistLocal?.vehiculo, kilometrajeFin: e.target.value } })
          }
        />
      </div>

      {template.secciones.map((seccion) => (
        <div key={seccion.id} className="card mb-4 overflow-hidden">
          <div className="bg-primary-light px-4 py-2 font-display font-semibold text-primary">
            {seccion.id}. {seccion.nombre}
          </div>
          <div className="divide-y divide-black/5">
            {seccion.items.map((item) => {
              const respuesta = checklistLocal?.respuestas.find((r) => r.itemId === item.id);
              const fotos = fotosPorItem?.filter((f) => f.itemId === item.id) || [];
              return (
                <div key={item.id} className="p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">
                      <span className="mr-2 font-mono text-xs text-muted">{item.id}</span>
                      {item.nombre}
                    </span>
                  </div>
                  <VerificationControl
                    tipo={item.tipoVerificacion}
                    valor={respuesta?.valor || ""}
                    onChange={(valor) => setRespuesta(item.id, valor)}
                  />
                  {/* Evidencia disponible siempre, no solo cuando el item la marca como
                      obligatoria — el cliente puede necesitarla en cualquier punto. */}
                  <div className="mt-3">
                    <PhotoCapture
                      checklistId={checklistId}
                      itemId={item.id}
                      fotosExistentes={fotos.length}
                      onFotoGuardada={() => {}}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="card p-4">
        <label className="mb-1 block text-sm font-medium">Observaciones</label>
        <textarea
          className="input"
          rows={3}
          defaultValue={checklistLocal?.observaciones}
          onBlur={(e) => guardarLocal({ observaciones: e.target.value })}
        />
        <label className="mb-1 mt-3 block text-sm font-medium">Nombre del responsable</label>
        <input
          className="input"
          defaultValue={checklistLocal?.responsable.nombre}
          onBlur={(e) => guardarLocal({ responsable: { nombre: e.target.value } })}
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-black/5 bg-surface/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl justify-end">
          <button onClick={enviar} disabled={guardando} className="btn-primary">
            {guardando ? "Guardando…" : online ? "Enviar checklist" : "Guardar (sin conexión)"}
          </button>
        </div>
      </div>
    </div>
  );
}
