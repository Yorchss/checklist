import Dexie, { Table } from "dexie";
import { ChecklistInstance, ChecklistTemplate } from "@/types";

/**
 * Base de datos local (IndexedDB vía Dexie). Esto es lo que responde al
 * punto (f) del cliente: si se pierde el internet en la tablet/celular/PC,
 * la app sigue funcionando contra esta base local y sincroniza después.
 *
 * Por qué Dexie sobre las otras alternativas que se plantearon:
 *  - IndexedDB nativo: mismo motor, pero la API cruda es muy verbosa/propensa
 *    a errores para este alcance. Dexie es una capa delgada encima, sin
 *    dependencias pesadas.
 *  - RxDB: trae replicación y resolución de conflictos más sofisticada, pero
 *    es overkill para un solo tipo de conflicto simple (last-write-wins por
 *    timestamp, que ya resuelve el backend en /api/sync/checklists). Si en
 *    el futuro se necesita sync en tiempo real multi-dispositivo más fino,
 *    ahí sí vale la pena migrar.
 *  - localStorage: descartado, límite de ~5MB y no sirve para fotos (los
 *    blobs de evidencia se guardan aquí como Blob/ArrayBuffer, IndexedDB
 *    no tiene ese límite práctico).
 */

export interface EvidenciaLocal {
  id?: number;
  checklistId: string;
  itemId: string;
  blob: Blob;
  creadoEn: string;
  sincronizada: boolean;
}

class ChecklistDB extends Dexie {
  checklists!: Table<ChecklistInstance, string>;
  templates!: Table<ChecklistTemplate, string>;
  evidencias!: Table<EvidenciaLocal, number>;

  constructor() {
    super("checklist-app-db");
    this.version(1).stores({
      // "id" como key primaria — es el mismo UUID que se manda al backend,
      // lo que hace que el sync sea idempotente (ver sync/syncQueue.ts)
      checklists: "id, tenantId, status, fechaChecklist",
      templates: "id, tenantId",
      evidencias: "++id, checklistId, itemId",
    });
  }
}

export const db = new ChecklistDB();
