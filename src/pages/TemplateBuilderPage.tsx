import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";
import { documentsApi, templatesApi } from "@/api/templates";
import { ChecklistTemplateSection, VerificationType } from "@/types";

type Paso = "subir" | "analizando" | "revisar";

/**
 * Implementa el punto (b): el cliente sube la foto de SU checklist en papel,
 * Document Intelligence lo lee, y aquí se muestra el borrador para que un
 * admin lo corrija antes de guardarlo como plantilla real. Nunca se guarda
 * automáticamente — el backend regresa esto como "borrador" a propósito
 * (ver documentAnalysisService.ts) porque la heurística de lectura no es
 * perfecta y el admin conoce su propio formato mejor que el modelo.
 */
export function TemplateBuilderPage() {
  const navigate = useNavigate();
  const { getAccessToken } = useAuth();
  const [paso, setPaso] = useState<Paso>("subir");
  const [nombre, setNombre] = useState("");
  const [secciones, setSecciones] = useState<ChecklistTemplateSection[]>([]);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPaso("analizando");
    setError("");
    try {
      const base64 = await fileToBase64(file);
      const token = await getAccessToken();
      const resultado = await documentsApi.analizar(token, base64, nombre || file.name);
      setSecciones(resultado.borrador.secciones);
      if (!nombre) setNombre(resultado.borrador.nombreSugerido);
      setPaso("revisar");
    } catch {
      setError("No se pudo analizar la imagen. Intenta con una foto más nítida y bien iluminada.");
      setPaso("subir");
    }
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

  async function guardarPlantilla() {
    setGuardando(true);
    try {
      const token = await getAccessToken();
      const template = await templatesApi.crear(token, {
        nombre,
        origen: "document-intelligence",
        secciones,
      });
      navigate(`/plantillas`, { state: { creada: template.id } });
    } catch {
      setError("No se pudo guardar la plantilla.");
    } finally {
      setGuardando(false);
    }
  }

  if (paso === "subir") {
    return (
      <div className="mx-auto max-w-lg">
        <h1 className="mb-4 text-2xl font-bold">Crear plantilla desde foto</h1>
        <div className="card p-6">
          <label className="mb-1 block text-sm font-medium">Nombre de la plantilla</label>
          <input
            className="input mb-4"
            placeholder="ej. Checklist KTM camioneta"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <label className="mb-1 block text-sm font-medium">Foto del checklist en papel</label>
          <input type="file" accept="image/*" capture="environment" onChange={handleArchivo} className="input" />
          <p className="mt-2 text-xs text-muted">
            Toma la foto derecha, con buena luz y que se lean bien los números de item.
          </p>
          {error && <p className="mt-3 text-sm text-malo">{error}</p>}
        </div>
      </div>
    );
  }

  if (paso === "analizando") {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="card p-10">
          <p className="font-semibold">Analizando el checklist…</p>
          <p className="mt-1 text-sm text-muted">Esto puede tardar unos segundos.</p>
        </div>
      </div>
    );
  }

  // paso === "revisar"
  return (
    <div className="mx-auto max-w-2xl pb-24">
      <h1 className="mb-1 text-2xl font-bold">Revisa la plantilla</h1>
      <p className="mb-5 text-sm text-muted">
        Esto es un borrador automático — corrige lo que haga falta antes de guardar.
      </p>

      {secciones.map((seccion, sIdx) => (
        <div key={seccion.id} className="card mb-4 overflow-hidden">
          <div className="bg-primary-light px-4 py-2 font-display font-semibold text-primary">
            {seccion.id}. {seccion.nombre}
          </div>
          <div className="divide-y divide-black/5">
            {seccion.items.map((item, iIdx) => (
              <div key={item.id} className="flex items-center gap-2 p-3">
                <span className="w-10 shrink-0 font-mono text-xs text-muted">{item.id}</span>
                <input
                  className="input"
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
                  ✕
                </button>
              </div>
            ))}
            {seccion.items.length === 0 && (
              <p className="p-3 text-sm text-muted">Sin items en esta sección.</p>
            )}
          </div>
        </div>
      ))}

      {error && <p className="mb-3 text-sm text-malo">{error}</p>}

      <div className="fixed bottom-0 left-0 right-0 border-t border-black/5 bg-surface/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-2xl justify-end gap-2">
          <button onClick={() => setPaso("subir")} className="btn-ghost">
            Volver a subir foto
          </button>
          <button onClick={guardarPlantilla} disabled={guardando} className="btn-primary">
            {guardando ? "Guardando…" : "Guardar plantilla"}
          </button>
        </div>
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
