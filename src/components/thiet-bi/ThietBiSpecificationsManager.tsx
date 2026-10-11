"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { apiClient, getApiErrorMessage } from "@/lib/api-client";
import Alert from "@/components/ui/alert/Alert";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import EntityManager, {
  type EntityField,
  type EntityRecord,
} from "@/components/asset-management/EntityManager";

type DevicePage = {
  data: EntityRecord[];
  totalPages: number;
};

export const specificationFields: EntityField[] = [
  {
    name: "ma_thiet_bi",
    label: "Mã thiết bị",
    readOnly: true,
    tableOnly: true,
    tableWidth: 145,
  },
  {
    name: "ma_thong_so",
    label: "Mã thông số",
    maxLength: 100,
    tableWidth: 145,
  },
  { name: "ten_thong_so", label: "Tên thông số", required: true, maxLength: 255 },
  {
    name: "don_vi_tinh",
    label: "Đơn vị tính",
    maxLength: 100,
    tableWidth: 120,
  },
  {
    name: "gia_tri",
    label: "Giá trị thông số",
    required: true,
    tableWidth: 145,
  },
  {
    name: "locked",
    label: "Khóa nhập liệu",
    type: "boolean",
    tableWidth: 110,
  },
  { name: "ghi_chu", label: "Ghi chú", type: "textarea" },
];

export default function ThietBiSpecificationsManager() {
  const [deviceId, setDeviceId] = useState("");
  const devicesQuery = useQuery({
    queryKey: ["equipment-specifications-devices"],
    queryFn: async () => {
      const firstPage = await apiClient.get<DevicePage>("/thietbis", {
        params: { page: 1, limit: 100 },
      });
      const devices = [...firstPage.data.data];
      for (let page = 2; page <= firstPage.data.totalPages; page += 1) {
        const response = await apiClient.get<DevicePage>("/thietbis", {
          params: { page, limit: 100 },
        });
        devices.push(...response.data.data);
      }
      return devices;
    },
  });

  const devices = devicesQuery.data ?? [];

  return (
    <>
      <PageBreadcrumb pageTitle="Thông số kỹ thuật thiết bị" />
      <div className="space-y-6">
        {devicesQuery.error && (
          <Alert
            variant="error"
            title="Không thể tải thiết bị"
            message={getApiErrorMessage(
              devicesQuery.error,
              "Không thể tải danh sách thiết bị",
            )}
            showLink={false}
          />
        )}
        <ComponentCard title="Chọn thiết bị">
          <label className="block max-w-xl text-sm font-medium text-gray-700 dark:text-gray-300">
            Thiết bị
            <select
              value={deviceId}
              onChange={(event) => setDeviceId(event.target.value)}
              disabled={devicesQuery.isPending}
              className="mt-1.5 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <option value="">
                {devicesQuery.isPending ? "Đang tải thiết bị..." : "Chọn thiết bị"}
              </option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {String(device.ma_thiet_bi ?? "")} —{" "}
                  {String(device.ten_thiet_bi ?? device.name ?? "")}
                </option>
              ))}
            </select>
          </label>
        </ComponentCard>
        {deviceId && (
          <EntityManager
            key={deviceId}
            endpoint={`/thietbis/${deviceId}/thong-so-ky-thuats`}
            title="Thông số kỹ thuật"
            fields={specificationFields}
            allowCopy
            allowBulkDelete
            allowExport
            copyExcludedFields={["locked"]}
            disableEditDeleteWhen={{ field: "locked", value: true }}
            tableFields={[
              "ma_thiet_bi",
              "ma_thong_so",
              "ten_thong_so",
              "don_vi_tinh",
              "gia_tri",
              "locked",
              "ghi_chu",
            ]}
          />
        )}
      </div>
    </>
  );
}
