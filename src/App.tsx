import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { AppShell } from "@/components/Layout/AppShell";
import { SessionGate } from "@/components/SessionGate";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { NewChecklistPage } from "@/pages/NewChecklistPage";
import { ChecklistDetailPage } from "@/pages/ChecklistDetailPage";
import { TemplatesPage } from "@/pages/TemplatesPage";
import { TemplateBuilderPage } from "@/pages/TemplateBuilderPage";
import { ManualTemplateBuilderPage } from "@/pages/ManualTemplateBuilderPage";
import { StatsPage } from "@/pages/StatsPage";
import { VisitantesPage } from "@/pages/VisitantesPage";
import { SettingsPage } from "@/pages/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <UnauthenticatedTemplate>
        <LoginPage />
      </UnauthenticatedTemplate>

      <AuthenticatedTemplate>
        <SessionGate>
          <AppShell>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/nuevo" element={<NewChecklistPage />} />
              <Route path="/checklists/:id" element={<ChecklistDetailPage />} />
              <Route path="/plantillas" element={<TemplatesPage />} />
              <Route path="/plantillas/nueva" element={<TemplateBuilderPage />} />
              <Route path="/plantillas/nueva-manual" element={<ManualTemplateBuilderPage />} />
              <Route path="/estadisticas" element={<StatsPage />} />
              <Route path="/visitantes" element={<VisitantesPage />} />
              <Route path="/configuracion" element={<SettingsPage />} />
            </Routes>
          </AppShell>
        </SessionGate>
      </AuthenticatedTemplate>
    </BrowserRouter>
  );
}
