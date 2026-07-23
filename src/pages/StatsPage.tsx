import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useAuth } from "@/auth/useAuth";
import { statsApi, StatsResponse } from "@/api/stats";

type Periodo = "dia" | "semana" | "mes";

const RANGO_DIAS: Record<Periodo, number> = { dia: 14, semana: 12 * 7, mes: 180 };

export function StatsPage() {
  const { getAccessToken } = useAuth();
  const [periodo, setPeriodo] = useState<Periodo>("dia");
  const [datos, setDatos] = useState<StatsResponse | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    const hasta = new Date();
    const desde = new Date();
    desde.setDate(desde.getDate() - RANGO_DIAS[periodo]);

    getAccessToken()
      .then((token) =>
        statsApi.checklists(token, desde.toISOString().slice(0, 10), hasta.toISOString().slice(0, 10))
      )
      .then(setDatos)
      .finally(() => setCargando(false));
  }, [periodo]); // eslint-disable-line react-hooks/exhaustive-deps

  // El backend siempre regresa granularidad diaria — aquí se agrupa a
  // semana/mes según lo que el usuario eligió ver.
  const serieAgrupada = useMemo(() => {
    if (!datos) return [];
    if (periodo === "dia") return datos.serie.map((d) => ({ etiqueta: formatoDia(d.fecha), cantidad: d.cantidad }));

    const grupos = new Map<string, number>();
    for (const punto of datos.serie) {
      const clave = periodo === "semana" ? inicioDeSemana(punto.fecha) : punto.fecha.slice(0, 7);
      grupos.set(clave, (grupos.get(clave) || 0) + punto.cantidad);
    }
    return Array.from(grupos.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([clave, cantidad]) => ({
        etiqueta: periodo === "semana" ? `Sem. ${formatoDia(clave)}` : formatoMes(clave),
        cantidad,
      }));
  }, [datos, periodo]);

  const totalPeriodoActual = serieAgrupada.reduce((acc, d) => acc + d.cantidad, 0);
  const promedioPorDia = datos ? (datos.total / RANGO_DIAS[periodo]).toFixed(1) : "—";

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Estadísticas</h1>
      <p className="mb-5 text-sm text-muted">Camiones inspeccionados a lo largo del tiempo.</p>

      <div className="mb-5 flex gap-2">
        {(["dia", "semana", "mes"] as Periodo[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              periodo === p ? "bg-primary text-white" : "bg-white text-muted border border-black/10"
            }`}
          >
            {p === "dia" ? "Por día" : p === "semana" ? "Por semana" : "Por mes"}
          </button>
        ))}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs text-muted">Total en el período</p>
          <p className="mt-1 font-display text-2xl font-bold text-primary">{totalPeriodoActual}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted">Promedio diario</p>
          <p className="mt-1 font-display text-2xl font-bold text-primary">{promedioPorDia}</p>
        </div>
        <div className="card p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-muted">Rango analizado</p>
          <p className="mt-1 font-display text-2xl font-bold text-primary">{RANGO_DIAS[periodo]}d</p>
        </div>
      </div>

      <div className="card p-4">
        {cargando && <p className="p-8 text-center text-sm text-muted">Cargando…</p>}
        {!cargando && serieAgrupada.length === 0 && (
          <p className="p-8 text-center text-sm text-muted">
            No hay checklists enviados en este período todavía.
          </p>
        )}
        {!cargando && serieAgrupada.length > 0 && (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={serieAgrupada}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5EAEF" vertical={false} />
              <XAxis dataKey="etiqueta" tick={{ fontSize: 12, fill: "#5B6B7A" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#5B6B7A" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", fontSize: 13 }}
                cursor={{ fill: "rgba(29,78,137,0.06)" }}
              />
              <Bar dataKey="cantidad" fill="#1D4E89" radius={[6, 6, 0, 0]} name="Camiones revisados" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function formatoDia(fechaISO: string): string {
  const [, m, d] = fechaISO.split("-");
  return `${d}/${m}`;
}

function formatoMes(fechaISO: string): string {
  const [anio, mes] = fechaISO.split("-");
  const nombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${nombres[parseInt(mes, 10) - 1]} ${anio}`;
}

function inicioDeSemana(fechaISO: string): string {
  const fecha = new Date(fechaISO + "T00:00:00");
  const dia = fecha.getDay();
  const diff = fecha.getDate() - dia + (dia === 0 ? -6 : 1); // lunes como inicio
  const lunes = new Date(fecha.setDate(diff));
  return lunes.toISOString().slice(0, 10);
}
