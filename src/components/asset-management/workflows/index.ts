import { handovers } from "./handovers";
import { moves } from "./moves";
import { receipts } from "./receipts";
import { statusUpdates } from "./status-updates";

export const equipmentWorkflows = {
  handovers,
  receipts,
  moves,
  statusUpdates,
};

export type EquipmentWorkflowKey = keyof typeof equipmentWorkflows;
