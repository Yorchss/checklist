import { VerificationType } from "@/types";

const OPCIONES_BRMN: { valor: string; etiqueta: string; clases: string }[] = [
  { valor: "B", etiqueta: "Bueno", clases: "bg-bueno text-white border-bueno" },
  { valor: "R", etiqueta: "Regular", clases: "bg-regular text-white border-regular" },
  { valor: "M", etiqueta: "Malo", clases: "bg-malo text-white border-malo" },
  { valor: "N/A", etiqueta: "N/A", clases: "bg-muted text-white border-muted" },
];

const OPCIONES_SI_NO: { valor: string; etiqueta: string; clases: string }[] = [
  { valor: "SI", etiqueta: "Sí", clases: "bg-bueno text-white border-bueno" },
  { valor: "NO", etiqueta: "No", clases: "bg-malo text-white border-malo" },
];

interface Props {
  tipo: VerificationType;
  valor: string;
  onChange: (valor: string) => void;
}

/**
 * Elemento distintivo de la app: en vez de un <select> o radios chiquitos,
 * pastillas grandes y coloreadas por semántica (verde=bueno, ámbar=regular,
 * rojo=malo). Esta es la interacción que un operador hace 30-60 veces por
 * checklist parado junto al camión, así que el objetivo es "tocar sin
 * fallar" incluso con guantes o con el celular en una mano.
 */
export function VerificationControl({ tipo, valor, onChange }: Props) {
  if (tipo === "TEXTO" || tipo === "NUMERO") {
    return (
      <input
        type={tipo === "NUMERO" ? "number" : "text"}
        className="input font-mono"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  const opciones = tipo === "SI_NO" ? OPCIONES_SI_NO : OPCIONES_BRMN;

  return (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {opciones.map((opcion) => {
        const seleccionado = valor === opcion.valor;
        return (
          <button
            key={opcion.valor}
            type="button"
            role="radio"
            aria-checked={seleccionado}
            onClick={() => onChange(opcion.valor)}
            className={`min-w-[64px] rounded-xl border-2 px-4 py-3 text-sm font-semibold transition active:scale-95 ${
              seleccionado
                ? opcion.clases
                : "bg-white text-muted border-black/10 hover:border-black/20"
            }`}
          >
            {opcion.etiqueta}
          </button>
        );
      })}
    </div>
  );
}
