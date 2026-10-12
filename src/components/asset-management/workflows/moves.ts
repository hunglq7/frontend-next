import type {
  EntityField,
  EntityManagerProps,
} from "../EntityManager";

export const moves = {
  endpoint: "/di-chuyen-thiet-bi",
  title: "Di chuyển thiết bị",
  tableFields: [
    "don_vi_id",
    "ngay_chung_tu",
    "so_chung_tu",
    "thiet_bi_id",
    "vi_tri_lap_dat_id",
    "ngay_ap_dung",
    "noi_dung",
    "ghi_chu",
  ],
  formColumns: 3,
  fields: [
    {
      name: "don_vi_id",
      label: "Phòng ban, đơn vị",
      required: true,
      lookup: {
        endpoint: "/donvis",
        valueField: "id",
        labelField: "ten_don_vi",
      },
      tableWidth: 210,
    },
    {
      name: "ngay_chung_tu",
      label: "Ngày chứng từ",
      type: "date" as const,
      required: true,
      tableWidth: 145,
    },
    {
      name: "so_chung_tu",
      label: "Số chứng từ",
      required: true,
      maxLength: 100,
      tableWidth: 145,
    },
    {
      name: "thiet_bi_id",
      label: "Thiết bị",
      required: true,
      lookup: {
        endpoint: "/thietbis",
        valueField: "id",
        labelField: "ten_thiet_bi",
        picker: {
          codeField: "ma_thiet_bi",
          nameField: "ten_thiet_bi",
        },
      },
      tableWidth: 220,
    },
    {
      name: "vi_tri_lap_dat_id",
      label: "Vị trí lắp đặt",
      required: true,
      lookup: {
        endpoint: "/vitrilapdats",
        valueField: "id",
        labelField: "ten_vi_tri",
      },
      tableWidth: 195,
    },
    {
      name: "ngay_ap_dung",
      label: "Ngày áp dụng",
      type: "date" as const,
      required: true,
      tableWidth: 145,
    },
    {
      name: "noi_dung",
      label: "Nội dung",
      type: "textarea" as const,
      tableWidth: 210,
      formSpan: 3,
    },
    {
      name: "ghi_chu",
      label: "Ghi chú",
      type: "textarea" as const,
      tableWidth: 150,
      formSpan: 3,
    },
  ] satisfies EntityField[],
  allowCopy: true,
  invalidateEndpoints: ["/thietbis"],
  dateRangeFilter: {
    dateFromField: "dateFrom",
    dateToField: "dateTo",
    organizationField: "don_vi_id",
    organizationEndpoint: "/donvis",
    organizationLabelField: "ten_don_vi",
  },
} satisfies EntityManagerProps;
