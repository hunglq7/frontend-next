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
  const { endpoint, title, fields } = equipmentWorkflows[workflow];
  const tableFields =
    workflow === "handovers"
      ? equipmentWorkflows.handovers.tableFields
      : workflow === "receipts"
        ? equipmentWorkflows.receipts.tableFields
        : workflow === "moves"
          ? equipmentWorkflows.moves.tableFields
        : undefined;
  const formColumns =
    workflow === "handovers"
      ? equipmentWorkflows.handovers.formColumns
      : workflow === "moves"
        ? equipmentWorkflows.moves.formColumns
        : 1;
  const dateRangeFilter =
    workflow === "handovers" ||
    workflow === "receipts" ||
    workflow === "moves"
      ? {
          dateFromField: "dateFrom",
          dateToField: "dateTo",
          organizationField:
            workflow === "moves" ? "don_vi_id" : "don_vi_lap_id",
          organizationEndpoint: "/donvis",
          organizationLabelField: "ten_don_vi",
          defaultToday: workflow === "handovers",
        }
      : undefined;
  const rowActions =
    workflow === "receipts" ? equipmentWorkflows.receipts.rowActions : undefined;
  return (
    <EntityManager
      endpoint={endpoint}
      title={title}
      fields={fields}
      tableFields={tableFields}
      rowActions={rowActions}
      showSequence={workflow !== "receipts"}
      actionsLabel={workflow === "receipts" ? "#" : "Thao tác"}
      allowCreate={workflow !== "receipts"}
      allowCopy={workflow === "handovers" || workflow === "moves"}
      allowEdit={workflow === "handovers" || workflow === "moves"}
      allowDelete={workflow === "handovers" || workflow === "moves"}
      disableEditDeleteWhen={
        workflow === "handovers"
          ? { field: "received", value: true }
          : undefined
      }
      allowBulkDelete={workflow === "handovers"}
      allowExport={workflow === "handovers"}
      invalidateEndpoints={workflow === "moves" ? ["/thietbis"] : []}
      dateRangeFilter={dateRangeFilter}
      formColumns={formColumns}
    />
  );
}
