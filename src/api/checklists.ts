import { apiRequest } from "./client";
import { ChecklistInstance } from "@/types";

export const checklistsApi = {
  crear: (token: string, checklist: Partial<ChecklistInstance>) =>
    apiRequest<ChecklistInstance>("/checklists", token, {
      method: "POST",
      body: JSON.stringify(checklist),
    }),

  obtener: (token: string, id: string) =>
    apiRequest<ChecklistInstance>(`/checklists/${id}`, token),

  listar: (
    token: string,
    filtros: { desde?: string; hasta?: string; status?: string } = {}
  ) => {
    const params = new URLSearchParams(
      Object.entries(filtros).filter(([, v]) => v) as [string, string][]
    );
    return apiRequest<{ items: ChecklistInstance[]; total: number }>(
      `/checklists?${params.toString()}`,
      token
    );
  },

  enviar: (token: string, id: string, destinatarios: string[]) =>
    apiRequest<{ id: string; status: string; pdfBlobPath: string }>(
      `/checklists/${id}/submit`,
      token,
      { method: "POST", body: JSON.stringify({ destinatarios }) }
    ),
};
