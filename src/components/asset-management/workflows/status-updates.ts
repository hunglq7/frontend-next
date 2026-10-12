import type {
  EntityField,
  EntityManagerProps,
} from "../EntityManager";

export const statusUpdates = {
  endpoint: "/cap-nhat-trang-thai",
  title: "Cập nhật trạng thái thiết bị",
  fields: [
    {
      name: "so_chung_tu",
      label: "Số chứng từ",
      required: true,
      maxLength: 100,
    },
    {
      name: "ngay_chung_tu",
      label: "Ngày chứng từ",
      type: "date" as const,
      required: true,
    },
    {
      name: "don_vi_lap_id",
      label: "Đơn vị lập",
      required: true,
      lookup: {
        endpoint: "/donvis",
        valueField: "id",
        labelField: "ten_don_vi",
      },
    },
    {
      name: "thiet_bi_id",
      label: "Thiết bị",
      required: true,
      lookup: {
        endpoint: "/thietbis",
        valueField: "id",
        labelField: "ten_thiet_bi",
      },
    },
    {
      name: "trang_thai_thiet_bi_id",
      label: "Trạng thái thiết bị",
      required: true,
      lookup: {
        endpoint: "/trang-thai-thiet-bis",
        valueField: "id",
        labelField: "name",
      },
    },
    {
      name: "ngay_ap_dung",
      label: "Ngày áp dụng",
      type: "date" as const,
      required: true,
    },
    { name: "noi_dung", label: "Nội dung", type: "textarea" as const },
    { name: "ghi_chu", label: "Ghi chú", type: "textarea" as const },
  ] satisfies EntityField[],
} satisfies EntityManagerProps;
