import type { EntityField } from "./EntityManager";

export const equipmentCatalogs = {
  maintenance: {
    endpoint: "/loai-bao-tris",
    title: "Loại bảo trì",
    fields: [
      { name: "code", label: "Mã loại bảo trì", required: true, maxLength: 64 },
      { name: "name", label: "Tên loại bảo trì", required: true, maxLength: 255 },
      {
        name: "parent",
        label: "Cấp trên",
        type: "number",
        lookup: {
          endpoint: "/loai-bao-tris",
          valueField: "id",
          labelField: "name",
        },
      },
      { name: "locked", label: "Khóa nhập liệu", type: "boolean" as const },
      { name: "notes", label: "Ghi chú", type: "textarea" as const },
    ] satisfies EntityField[],
  },
  calibration: {
    endpoint: "/loai-hieu-chuans",
    title: "Loại hiệu chuẩn",
    fields: [
      { name: "code", label: "Mã loại hiệu chuẩn", required: true, maxLength: 64 },
      { name: "name", label: "Tên loại hiệu chuẩn", required: true, maxLength: 255 },
      {
        name: "parent",
        label: "Cấp trên",
        type: "number",
        lookup: {
          endpoint: "/loai-hieu-chuans",
          valueField: "id",
          labelField: "name",
        },
      },
      { name: "locked", label: "Khóa nhập liệu", type: "boolean" as const },
      { name: "notes", label: "Ghi chú", type: "textarea" as const },
    ] satisfies EntityField[],
  },
  inspection: {
    endpoint: "/loai-kiem-dinhs",
    title: "Loại kiểm định",
    fields: [
      { name: "code", label: "Mã loại kiểm định", required: true, maxLength: 64 },
      { name: "name", label: "Tên loại kiểm định", required: true, maxLength: 255 },
      {
        name: "parent",
        label: "Cấp trên",
        type: "number",
        lookup: {
          endpoint: "/loai-kiem-dinhs",
          valueField: "id",
          labelField: "name",
        },
      },
      { name: "locked", label: "Khóa nhập liệu", type: "boolean" as const },
      { name: "notes", label: "Ghi chú", type: "textarea" as const },
    ] satisfies EntityField[],
  },
  status: {
    endpoint: "/trang-thai-thiet-bis",
    title: "Trạng thái thiết bị",
    fields: [
      { name: "code", label: "Mã trạng thái", required: true, maxLength: 64 },
      { name: "name", label: "Tên trạng thái", required: true, maxLength: 255 },
      {
        name: "parent",
        label: "Cấp trên",
        type: "number",
        lookup: {
          endpoint: "/trang-thai-thiet-bis",
          valueField: "id",
          labelField: "name",
        },
      },
      { name: "locked", label: "Khóa nhập liệu", type: "boolean" as const },
      { name: "notes", label: "Ghi chú", type: "textarea" as const },
    ] satisfies EntityField[],
  },
} as const;

export type EquipmentCatalogKey = keyof typeof equipmentCatalogs;
