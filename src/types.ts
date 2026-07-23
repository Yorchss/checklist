// Espejo de src/shared/types.ts del backend — mantener sincronizado a mano
// (proyectos separados; si esto crece, vale la pena moverlo a un paquete
// compartido npm/workspace).

export type VerificationType = "BRMN" | "SI_NO" | "TEXTO" | "NUMERO";

export interface ChecklistTemplateItem {
  id: string;
  nombre: string;
  tipoVerificacion: VerificationType;
  requiereEvidenciaFoto?: boolean;
}

export interface ChecklistTemplateSection {
  id: string;
  nombre: string;
  items: ChecklistTemplateItem[];
}

export interface ChecklistTemplate {
  id: string;
  tenantId: string;
  nombre: string;
  origen: "manual" | "document-intelligence";
  secciones: ChecklistTemplateSection[];
  logoUrl?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ChecklistItemRespuesta {
  itemId: string;
  valor: string;
  evidenciaFotoBlobPaths?: string[];
}

export type ChecklistStatus = "borrador" | "enviado" | "archivado";

export interface ChecklistInstance {
  id: string;
  tenantId: string;
  templateId: string;
  creadoPor: string;
  vehiculo: {
    marca?: string;
    modelo?: string;
    kilometrajeInicio?: string;
    kilometrajeFin?: string;
  };
  responsable: { nombre: string; firmaBlobPath?: string };
  respuestas: ChecklistItemRespuesta[];
  observaciones?: string;
  status: ChecklistStatus;
  jsonBlobPath?: string;
  pdfBlobPath?: string;
  pdfUrl?: string | null;
  creadoEn: string;
  actualizadoEn: string;
  fechaChecklist: string;
  /** true si el registro solo existe localmente y falta subirse al backend */
  pendienteDeSync?: boolean;
}
