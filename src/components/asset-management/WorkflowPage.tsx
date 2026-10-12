import EntityManager from "./EntityManager";
import {
  equipmentWorkflows,
  type EquipmentWorkflowKey,
} from "./workflows";

export default function WorkflowPage({
  workflow,
}: {
  workflow: EquipmentWorkflowKey;
}) {
  return <EntityManager {...equipmentWorkflows[workflow]} />;
}
