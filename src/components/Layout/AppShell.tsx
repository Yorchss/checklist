import { PropsWithChildren } from "react";
import { Link, useLocation } from "react-router-dom";
import { ClipboardList, PlusCircle, LayoutTemplate, BarChart3, UserPlus, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/auth/useAuth";
import { SyncStatusBadge } from "@/components/SyncStatusBadge";

const NAV = [
  { to: "/", label: "Checklists", icon: ClipboardList },
  { to: "/nuevo", label: "Nuevo checklist", icon: PlusCircle },
  { to: "/plantillas", label: "Plantillas", icon: LayoutTemplate },
  { to: "/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { to: "/visitantes", label: "Visitantes", icon: UserPlus },
];

export function AppShell({ children }: PropsWithChildren) {
  const { nombre, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-display text-sm font-bold text-white">
                ✓
              </span>
              <span className="font-display text-lg font-bold text-primary">Checklist</span>
            </Link>
            <nav className="hidden gap-1 lg:flex">
              {NAV.map((item) => {
                const activo = location.pathname === item.to;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      activo ? "bg-primary-light text-primary" : "text-muted hover:bg-black/5"
                    }`}
                  >
                    <Icon size={16} strokeWidth={2} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <SyncStatusBadge />
            <Link
              to="/configuracion"
              className={`rounded-lg p-2 transition ${
                location.pathname === "/configuracion" ? "bg-primary-light text-primary" : "text-muted hover:bg-black/5"
              }`}
              title="Configuración"
            >
              <Settings size={18} />
            </Link>
            <span className="hidden text-sm text-muted sm:inline">{nombre}</span>
            <button onClick={logout} className="btn-ghost !px-3 !py-2" title="Salir">
              <LogOut size={16} />
            </button>
          </div>
        </div>
        {/* Nav móvil / tablet */}
        <nav className="flex gap-1 overflow-x-auto border-t border-black/5 px-4 py-2 lg:hidden">
          {NAV.map((item) => {
            const activo = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                  activo ? "bg-primary-light text-primary" : "text-muted"
                }`}
              >
                <Icon size={16} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
