"use client";

import EntityManager from "@/components/asset-management/EntityManager";
import { specificationFields } from "./ThietBiSpecificationsManager";

const fields = [
  {
    name: "id",
    label: "Số thứ tự",
    type: "number" as const,
    readOnly: true,
    formSpan: 1 as const,
  },
  {
    name: "ma_thiet_bi",
    label: "Mã thiết bị",
    required: true,
    maxLength: 50,
    tableWidth: 145,
    formSpan: 2 as const,
  },
  {
    name: "locked",
    label: "Khóa nhập liệu",
    type: "boolean" as const,
    formSpan: 1 as const,
  },
  {
    name: "ten_thiet_bi",
    label: "Tên thiết bị",
    required: true,
    maxLength: 255,
    tableWidth: 215,
    formSpan: 3 as const,
  },
  {
    name: "don_vi_tinh_id",
    label: "Đơn vị tính",
    lookup: {
      endpoint: "/donvitinhs",
      valueField: "id",
      labelField: "ten_don_vi_tinh",
    },
    tableWidth: 215,
    formSpan: 1 as const,
  },
  {
    name: "loai_thiet_bi_id",
    label: "Loại thiết bị",
    lookup: {
      endpoint: "/loaithietbis",
      valueField: "id",
      labelField: "loai_thiet_bi",
    },
    tableWidth: 215,
    formSpan: 4 as const,
  },
  {
    name: "nuoc_san_xuat",
    label: "Nước sản xuất",
    maxLength: 100,
    tableWidth: 215,
    formSpan: 2 as const,
  },
  { name: "so_quan_ly", label: "Số quản lý", maxLength: 100, tableWidth: 145, formSpan: 1 as const },
  {
    name: "ngay_dua_vao_su_dung",
    label: "Ngày đưa vào sử dụng",
    type: "date" as const,
    tableWidth: 145,
    formSpan: 1 as const,
  },
  {
    name: "tai_san",
    label: "Tài sản",
    type: "boolean" as const,
    formSpan: 2 as const,
  },
  {
    name: "phong_chu_quan_id",
    label: "Phòng chủ quản",
    lookup: {
      endpoint: "/donvis",
      valueField: "id",
      labelField: "ten_don_vi",
    },
    formSpan: 2 as const,
  },
  {
    name: "don_vi_id",
    label: "Phòng ban, đơn vị",
    lookup: {
      endpoint: "/donvis",
      valueField: "id",
      labelField: "ten_don_vi",
    },
    formSpan: 2 as const,
  },
  {
    name: "vi_tri_lap_dat_id",
    label: "Vị trí lắp đặt",
    lookup: {
      endpoint: "/vitrilapdats",
      valueField: "id",
      labelField: "ten_vi_tri",
    },
    formSpan: 2 as const,
  },
  {
    name: "khu_vuc_id",
    label: "Khu vực",
    lookup: {
      endpoint: "/khuvucs",
      valueField: "id",
      labelField: "Tên_khu_vuc",
    },
    formSpan: 2 as const,
  },
  {
    name: "trang_thai_thiet_bi_id",
    label: "Trạng thái thiết bị",
    lookup: {
      endpoint: "/trang-thai-thiet-bis",
      valueField: "id",
      labelField: "name",
    },
    formSpan: 2 as const,
  },
  {
    name: "nhiem_vu",
    label: "Nhiệm vụ của thiết bị",
    type: "textarea" as const,
    formSpan: 4 as const,
  },
  {
    name: "ghi_chu",
    label: "Ghi chú",
    type: "textarea" as const,
    formSpan: 4 as const,
  },
];

export default function ThietbiManager() {
  return (
    <EntityManager
      endpoint="/thietbis"
      title="Thiết bị"
      fields={fields}
      autoSizeTable
      columnFilters
      showSearch={false}
      allowBulkDelete
      allowExport
      disableEditDeleteWhen={{ field: "locked", value: true }}
      tableFields={[
        "ma_thiet_bi",
        "locked",
        "ten_thiet_bi",
        "don_vi_tinh_id",
        "loai_thiet_bi_id",
        "nuoc_san_xuat",
        "so_quan_ly",
        "ngay_dua_vao_su_dung",
        "tai_san",
        "phong_chu_quan_id",
        "don_vi_id",
        "vi_tri_lap_dat_id",
        "khu_vuc_id",
        "trang_thai_thiet_bi_id",
        "nhiem_vu",
        "ghi_chu",
      ]}
      allowCopy
      copyExcludedFields={["don_vi_id", "vi_tri_lap_dat_id"]}
      details={{
        endpoint: "/thietbis/{id}/thong-so-ky-thuats",
        title: "Thông số kỹ thuật",
        fields: specificationFields,
        allowBulkDelete: true,
        allowExport: true,
        copyExcludedFields: ["locked"],
        disableEditDeleteWhen: { field: "locked", value: true },
        tableFields: [
          "ma_thong_so",
          "ten_thong_so",
          "don_vi_tinh",
          "gia_tri",
          "cap_tren_id",
          "locked",
          "ghi_chu",
        ],
        tree: { parentField: "cap_tren_id" },
      }}
      formColumns={4}
    />
  );
}
