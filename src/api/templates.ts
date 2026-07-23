import { apiRequest } from "./client";
import { ChecklistTemplate, ChecklistTemplateSection } from "@/types";

export const templatesApi = {
  listar: (token: string) =>
    apiRequest<{ items: ChecklistTemplate[] }>("/templates", token),

  obtener: (token: string, id: string) =>
    apiRequest<ChecklistTemplate>(`/templates/${id}`, token),

  crear: (token: string, template: Partial<ChecklistTemplate>) =>
    apiRequest<ChecklistTemplate>("/templates", token, {
      method: "POST",
      body: JSON.stringify(template),
    }),
};

export const documentsApi = {
  /** Sube la foto de un checklist en papel y regresa un borrador de plantilla. */
  analizar: (token: string, imageBase64: string, nombreSugerido: string) =>
    apiRequest<{
      borrador: {
        nombreSugerido: string;
        origen: "document-intelligence";
        secciones: ChecklistTemplateSection[];
      };
      imagenOriginalBlobPath: string;
      advertencia: string;
    }>("/documents/analyze", token, {
      method: "POST",
      body: JSON.stringify({ imageBase64, nombreSugerido }),
    }),
};
