import { useEffect, useRef, useState } from "react";
import { Camera, User } from "lucide-react";
import { useAuth } from "@/auth/useAuth";
import { visitantesApi, Visitante } from "@/api/visitantes";

/**
 * Módulo de control de acceso — sin relación con los checklists de
 * camiones. Registra quién entra a las instalaciones: nombre, empresa,
 * teléfono y una foto de rostro tomada ahí mismo.
 *
 * A diferencia de PhotoCapture (usado en checklists), este flujo sube la
 * foto de inmediato en vez de encolarla en IndexedDB — el registro de
 * acceso normalmente se hace en la caseta/recepción, con conexión
 * disponible. Si más adelante se necesita soportar el mismo escenario
 * offline que los checklists, se puede reusar el mismo patrón de
 * PhotoCapture + syncEngine.
 */
export function VisitantesPage() {
  const { getAccessToken } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoBlobPath, setFotoBlobPath] = useState<string | undefined>();
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [cargandoLista, setCargandoLista] = useState(true);

  useEffect(() => {
    cargarLista();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function cargarLista() {
    setCargandoLista(true);
    try {
      const token = await getAccessToken();
      const res = await visitantesApi.listar(token);
      setVisitantes(res.items.sort((a, b) => b.creadoEn.localeCompare(a.creadoEn)));
    } finally {
      setCargandoLista(false);
    }
  }

  async function comprimirImagen(file: File): Promise<Blob> {
    const bitmap = await createImageBitmap(file);
    const maxLado = 800; // rostro, no necesita más resolución que esto
    const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width * escala;
    canvas.height = bitmap.height * escala;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.8));
  }

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendoFoto(true);
    try {
      const comprimida = await comprimirImagen(file);
      setFotoPreview(URL.createObjectURL(comprimida));
      const token = await getAccessToken();
      const { blobPath } = await visitantesApi.subirFoto(token, comprimida);
      setFotoBlobPath(blobPath);
    } finally {
      setSubiendoFoto(false);
    }
  }

  async function registrar() {
    if (!nombre.trim()) {
      setMensaje("El nombre es requerido.");
      return;
    }
    setGuardando(true);
    setMensaje("");
    try {
      const token = await getAccessToken();
      await visitantesApi.crear(token, { nombre, empresa, telefono, fotoBlobPath });
      setNombre("");
      setEmpresa("");
      setTelefono("");
      setFotoPreview(null);
      setFotoBlobPath(undefined);
      if (inputRef.current) inputRef.current.value = "";
      setMensaje("Visita registrada.");
      cargarLista();
    } catch {
      setMensaje("No se pudo registrar la visita.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div>
        <h1 className="mb-1 text-2xl font-bold">Registro de visitas</h1>
        <p className="mb-5 text-sm text-muted">Control de acceso a las instalaciones.</p>

        <div className="card p-5">
          <div className="mb-4 flex justify-center">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-primary/30 bg-primary-light text-primary hover:border-primary"
            >
              {fotoPreview ? (
                <img src={fotoPreview} alt="Foto del visitante" className="h-full w-full object-cover" />
              ) : subiendoFoto ? (
                <span className="text-xs">Subiendo…</span>
              ) : (
                <Camera size={28} />
              )}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleFoto}
            />
          </div>

          <label className="mb-1 block text-sm font-medium">Nombre completo</label>
          <input className="input mb-3" value={nombre} onChange={(e) => setNombre(e.target.value)} />

          <label className="mb-1 block text-sm font-medium">Empresa</label>
          <input className="input mb-3" value={empresa} onChange={(e) => setEmpresa(e.target.value)} />

          <label className="mb-1 block text-sm font-medium">Teléfono</label>
          <input className="input mb-4" value={telefono} onChange={(e) => setTelefono(e.target.value)} />

          <button onClick={registrar} disabled={guardando || subiendoFoto} className="btn-primary w-full">
            {guardando ? "Registrando…" : "Registrar entrada"}
          </button>
          {mensaje && <p className="mt-3 text-center text-sm text-muted">{mensaje}</p>}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold">Visitas recientes</h2>
        {cargandoLista && <p className="text-sm text-muted">Cargando…</p>}
        {!cargandoLista && visitantes.length === 0 && (
          <div className="card p-8 text-center text-muted">Todavía no hay visitas registradas.</div>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          {visitantes.map((v) => (
            <div key={v.id} className="card flex items-center gap-3 p-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-primary">
                {v.fotoUrl ? (
                  <img src={v.fotoUrl} alt={v.nombre} className="h-full w-full object-cover" />
                ) : (
                  <User size={20} />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{v.nombre}</p>
                <p className="truncate text-xs text-muted">{v.empresa || "—"} · {v.telefono || "—"}</p>
                <p className="font-mono text-[11px] text-muted">
                  {new Date(v.creadoEn).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
