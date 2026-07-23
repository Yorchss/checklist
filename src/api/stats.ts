import { apiRequest } from "./client";

export interface StatsResponse {
  serie: { fecha: string; cantidad: number }[];
  total: number;
}

export const statsApi = {
  checklists: (token: string, desde: string, hasta: string) =>
    apiRequest<StatsResponse>(`/stats/checklists?desde=${desde}&hasta=${hasta}`, token),
};
