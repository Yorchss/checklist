import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/auth/useAuth";
import { templatesApi } from "@/api/templates";
import { ChecklistTemplateSection, ChecklistTemplateItem, VerificationType } from "@/types";

let contadorId = 0;
function nuevoId() {
  contadorId += 1;
  return `local-${contadorId}`;
}

/**
 * Alternativa a TemplateBuilderPage (que parte de una foto + Document
 * Intelligence): aquí el admin arma la plantilla a mano, sección por
 * sección, item por item — para cuando no hay un checklist físico que
 * fotografiar, o simplemente no se quiere depender del OCR.
 */
export function ManualTemplateBuilderPage() {
  const navigate = useNavigate();
  const { getAccessToken } = useAuth();
  const [nombre, setNombre] = useState("");
  const [secciones, setSecciones] = useState<ChecklistTemplateSection[]>([
    { id: "1", nombre: "Sección 1", items: [] },
  ]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  function agregarSeccion() {
    setSecciones([...secciones, { id: nuevoId(), nombre: "", items: [] }]);
  }

  function actualizarSeccion(idx: number, nombreNuevo: string) {
    const copia = [...secciones];
    copia[idx] = { ...copia[idx], nombre: nombreNuevo };
    setSecciones(copia);
  }

  function eliminarSeccion(idx: number) {
    setSecciones(secciones.filter((_, i) => i !== idx));
  }

  function agregarItem(seccionIdx: number) {
    const copia = [...secciones];
    const nuevoItem: ChecklistTemplateItem = {
      id: nuevoId(),
      nombre: "",
      tipoVerificacion: "BRMN",
    };
    copia[seccionIdx] = { ...copia[seccionIdx], items: [...copia[seccionIdx].items, nuevoItem] };
    setSecciones(copia);
  }

  function actualizarItem(
    seccionIdx: number,
    itemIdx: number,
    campo: "nombre" | "tipoVerificacion",
    valor: string
  ) {
    const copia = [...secciones];
    copia[seccionIdx] = {
      ...copia[seccionIdx],
      items: copia[seccionIdx].items.map((item, i) =>
        i === itemIdx ? { ...item, [campo]: valor } : item
      ),
    };
    setSecciones(copia);
  }

  function eliminarItem(seccionIdx: number, itemIdx: number) {
    const copia = [...secciones];
    copia[seccionIdx] = {
      ...copia[seccionIdx],
      items: copia[seccionIdx].items.filter((_, i) => i !== itemIdx),
    };
    setSecciones(copia);
  }

  async function guardar() {
    setError("");
    if (!nombre.trim()) return setError("Ponle un nombre a la plantilla.");
    if (secciones.some((s) => !s.nombre.trim())) return setError("Todas las secciones necesitan nombre.");
    if (secciones.every((s) => s.items.length === 0)) return setError("Agrega al menos un item.");
    if (secciones.some((s) => s.items.some((i) => !i.nombre.trim())))
      return setError("Todos los items necesitan descripción.");

    setGuardando(true);
    try {
      const token = await getAccessToken();
      // Renumeramos secciones/items con IDs limpios (1, 1.1, 1.2, 2, ...)
      // antes de guardar — los "local-N" solo sirven para el editor.
      const seccionesFinales = secciones.map((s, si) => ({
        ...s,
        id: String(si + 1),
        items: s.items.map((it, ii) => ({ ...it, id: `${si + 1}.${ii + 1}` })),
      }));

      await templatesApi.crear(token, {
        nombre,
        origen: "manual",
        secciones: seccionesFinales,
      });
      navigate("/plantillas");
    } catch {
      setError("No se pudo guardar la plantilla.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <h1 className="mb-1 text-2xl font-bold">Crear plantilla desde cero</h1>
      <p className="mb-5 text-sm text-muted">
        Arma tu checklist a mano — útil si no tienes un formato en papel para fotografiar.
      </p>

      <div className="card mb-4 p-4">
        <label className="mb-1 block text-sm font-medium">Nombre de la plantilla</label>
        <input
          className="input"
          placeholder="ej. Checklist inspección diaria"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </div>

      {secciones.map((seccion, sIdx) => (
        <div key={seccion.id} className="card mb-4 overflow-hidden">
          <div className="flex items-center gap-2 bg-primary-light px-4 py-2">
            <input
              className="input !border-none !bg-transparent !py-1 font-display font-semibold text-primary"
              placeholder={`Nombre de la sección ${sIdx + 1}`}
              value={seccion.nombre}
              onChange={(e) => actualizarSeccion(sIdx, e.target.value)}
            />
            <button onClick={() => eliminarSeccion(sIdx)} className="btn-ghost !px-2 !py-1 text-malo" title="Eliminar sección">
              <Trash2 size={16} />
            </button>
          </div>
          <div className="divide-y divide-black/5">
            {seccion.items.map((item, iIdx) => (
              <div key={item.id} className="flex items-center gap-2 p-3">
                <input
                  className="input"
                  placeholder="Descripción del item"
                  value={item.nombre}
                  onChange={(e) => actualizarItem(sIdx, iIdx, "nombre", e.target.value)}
                />
                <select
                  className="input w-32 shrink-0"
                  value={item.tipoVerificacion}
                  onChange={(e) => actualizarItem(sIdx, iIdx, "tipoVerificacion", e.target.value as VerificationType)}
                >
                  <option value="BRMN">B/R/M/N-A</option>
                  <option value="SI_NO">Sí/No</option>
                  <option value="TEXTO">Texto</option>
                  <option value="NUMERO">Número</option>
                </select>
                <button onClick={() => eliminarItem(sIdx, iIdx)} className="btn-ghost !px-2 !py-1 text-malo">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              onClick={() => agregarItem(sIdx)}
              className="flex w-full items-center justify-center gap-1.5 p-3 text-sm font-medium text-primary hover:bg-primary-light"
            >
              <Plus size={16} /> Agregar item
            </button>
          </div>
        </div>
      ))}

      <button onClick={agregarSeccion} className="btn-secondary mb-4 w-full">
        <Plus size={16} /> Agregar sección
      </button>

      {error && <p className="mb-3 text-sm text-malo">{error}</p>}

      <div className="fixed bottom-0 left-0 right-0 border-t border-black/5 bg-surface/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-2xl justify-end">
          <button onClick={guardar} disabled={guardando} className="btn-primary">
            {guardando ? "Guardando…" : "Guardar plantilla"}
          </button>
        </div>
      </div>
    </div>
  );
}
