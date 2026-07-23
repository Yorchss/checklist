import { useRef, useState } from "react";
import { db } from "@/offline/db";

interface Props {
  checklistId: string;
  itemId: string;
  fotosExistentes: number;
  onFotoGuardada: () => void;
}

/**
 * Captura de evidencia fotográfica. `capture="environment"` abre
 * directamente la cámara trasera en móviles (no la galería), que es lo que
 * se quiere para evidencia real y no una foto vieja del rollo.
 *
 * La foto SIEMPRE se guarda primero en IndexedDB (tabla `evidencias`) y se
 * marca como no sincronizada — nunca se sube directo al backend desde aquí.
 * El syncEngine es el único responsable de subirla cuando hay conexión.
 * Esto hace que capturar evidencia funcione igual con o sin internet.
 */
export function PhotoCapture({ checklistId, itemId, fotosExistentes, onFotoGuardada }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [comprimiendo, setComprimiendo] = useState(false);

  async function comprimirImagen(file: File): Promise<Blob> {
    const bitmap = await createImageBitmap(file);
    const maxLado = 1600;
    const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width * escala;
    canvas.height = bitmap.height * escala;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.72);
    });
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setComprimiendo(true);
    try {
      // Comprimir en el dispositivo antes de guardar — las fotos de cámara
      // sin procesar son 3-8MB, esto las baja a ~200-400KB sin perder
      // legibilidad para efectos de auditoría.
      const blobComprimido = await comprimirImagen(file);
      await db.evidencias.add({
        checklistId,
        itemId,
        blob: blobComprimido,
        creadoEn: new Date().toISOString(),
        sincronizada: false,
      });
      onFotoGuardada();
    } finally {
      setComprimiendo(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        className="btn-secondary"
        disabled={comprimiendo}
        onClick={() => inputRef.current?.click()}
      >
        {comprimiendo ? "Guardando…" : "📷 Agregar evidencia"}
      </button>
      {fotosExistentes > 0 && (
        <span className="text-xs text-muted">{fotosExistentes} foto(s) adjunta(s)</span>
      )}
    </div>
  );
}
