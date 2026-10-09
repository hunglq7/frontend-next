"use client";

import ComponentCard from "@/components/common/ComponentCard";
import ExportExcelButton from "@/components/common/ExportExcelButton";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ViTriLapDatModal from "@/components/vi-tri-lap-dat/VitrilapdatModal";
import Pagination from "@/components/tables/Pagination";
import Button from "@/components/ui/button/Button";
import Popconfirm from "@/components/ui/Popconfirm";
import { PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { getApiErrorMessage } from "@/lib/api-client";
import {
  useDeleteViTriLapDat,
  useViTriLapDatList,
  useSaveViTriLapDat,
} from "@/hooks/use-vi-tri-lap-dat";
import {
  getAllMatchingViTriLapDat,
  type ViTriLapDat,
} from "@/services/vi-tri-lap-dat.service";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Alert from "../ui/alert/Alert";
import type { FormData } from "./vitrilapdatSchema";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}
export default function VitrilapdatManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const vitrilapdatQuery = useViTriLapDatList({
    page: currentPage,
    limit: pageSize,
    search: debouncedSearch,
  });
  const pageResult = vitrilapdatQuery.data;
  const vitrilapdats = pageResult?.data ?? [];
  const isLoading =
    vitrilapdatQuery.isPending || vitrilapdatQuery.isPlaceholderData;
  const listError = vitrilapdatQuery.error
    ? getApiErrorMessage(
        vitrilapdatQuery.error,
        "Không thể tải danh sách vị trí lắp đặt",
      )
    : null;
  const activePage = pageResult?.page ?? currentPage;
  const totalPages = Math.max(pageResult?.totalPages ?? 0, 1);
  const totalVitrilapdats = pageResult?.total ?? 0;
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [editingVitrilapdat, setEditingVitrilapdat] =
    useState<ViTriLapDat | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  const saveMutation = useSaveViTriLapDat();
  const deleteMutation = useDeleteViTriLapDat();
  const isSaving = saveMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const [error, setError] = useState<string | null>(null);

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingVitrilapdat(null);
  };

  const openCreateModal = () => {
    setEditingVitrilapdat(null);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (Vitrilapdat: ViTriLapDat) => {
    setEditingVitrilapdat(Vitrilapdat);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async ({ ten_vi_tri }: FormData) => {
    setError(null);
    try {
      const response = await saveMutation.mutateAsync({
        vitrilapdatId: editingVitrilapdat?.id ?? null,
        ten_vi_tri,
      });

      setSelectedIds(new Set());
      toast.success(response.data.message);
      setIsModalOpen(false);
      setEditingVitrilapdat(null);
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Không thể lưu đơn vị"));
    }
  };

  const deleteVitrilapdat = async (ids: number[], bulk: boolean) => {
    if (ids.length === 0 || isDeleting) return;
    setError(null);
    try {
      const response = await deleteMutation.mutateAsync({ ids, bulk });
      setSelectedIds(new Set());
      toast.success(response.data.message);
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Không thể xóa đơn vị"));
    }
  };

  const firstVisibleVitrilapdat =
    totalVitrilapdats === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const lastVisibleVitrilapdat = Math.min(
    activePage * pageSize,
    totalVitrilapdats,
  );
  const allPageVitrilapdatsSelected =
    vitrilapdats.length > 0 &&
    vitrilapdats.every((item) => selectedIds.has(item.id));

  return (
    <>
      <PageBreadcrumb pageTitle="Vị trí" />
      <div className="space-y-6">
        {/* Tìm Kiếm */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            type="search"
            aria-label="Tìm kiếm vị trí"
            placeholder="Tìm kiếm vị trí..."
            maxLength={255}
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
              setSelectedIds(new Set());
            }}
            className="h-11 w-full max-w-sm rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-500"
          />
          {/* Xóa dòng chọn */}
          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.size > 0 && (
              <Popconfirm
                message={`Bạn có chắc muốn xóa ${selectedIds.size} bản ghi đã chọn?`}
                onConfirm={() => deleteVitrilapdat([...selectedIds], true)}
                disabled={isDeleting}
              >
                <button
                  type="button"
                  disabled={isDeleting}
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-error-300 px-4 py-2 text-sm font-medium text-error-600 hover:bg-error-50 disabled:opacity-50 dark:border-error-800 dark:text-error-400 dark:hover:bg-error-500/10"
                >
                  <TrashBinIcon />
                  Xóa dòng chọn({selectedIds.size})
                </button>
              </Popconfirm>
            )}

            {/* Thêm mới bản ghi*/}
            <Button
              size="sm"
              onClick={openCreateModal}
              startIcon={<PlusIcon />}
            >
              Thêm mới
            </Button>
            {/* Xuất Excel */}
            <ExportExcelButton
              data={vitrilapdats}
              loadData={() => getAllMatchingViTriLapDat(debouncedSearch)}
              fileName="vi-tri"
              sheetName="Vị trí"
              columns={[
                { header: "Mã thiết bị", value: (item) => item.id },
                { header: "Tên vị trí", value: (item) => item.ten_vi_tri },
                {
                  header: "Ngày tạo",
                  value: (item) => formatDate(item.createdAt),
                },
                {
                  header: "Ngày cập nhật",
                  value: (item) => formatDate(item.updatedAt),
                },
              ]}
            />
          </div>
        </div>

        {(error || listError) && !isModalOpen && (
          <Alert
            variant="error"
            title="Error Message"
            message={error ?? listError ?? ""}
            showLink={false}
          />
        )}
        {/* Bảng đơn vị */}
        <ComponentCard title="Cập nhật vị trí">
          <div className="overflow-x-auto">
            <table className="w-full min-w-150 text-start">
              <thead className="border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Chọn tất cả vị trí"
                      checked={allPageVitrilapdatsSelected}
                      onChange={(event) =>
                        setSelectedIds((previous) => {
                          const next = new Set(previous);
                          vitrilapdats.forEach((item) => {
                            if (event.target.checked) next.add(item.id);
                            else next.delete(item.id);
                          });
                          return next;
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-start text-theme-xs font-bold text-gray-500 dark:text-gray-400">
                    Tên vị trí
                  </th>
                  <th className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                    Ngày tạo
                  </th>
                  <th className="w-28 px-4 py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      Đang tải danh sách...
                    </td>
                  </tr>
                ) : vitrilapdats.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      {searchTerm
                        ? "Không tìm thấy vị trí phù hợp"
                        : "Chưa có vị trí nào"}
                    </td>
                  </tr>
                ) : (
                  vitrilapdats.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 dark:hover:bg-white/3"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Chọn vị trí ${item.ten_vi_tri}`}
                          checked={selectedIds.has(item.id)}
                          onChange={(event) =>
                            setSelectedIds((previous) => {
                              const next = new Set(previous);
                              if (event.target.checked) next.add(item.id);
                              else next.delete(item.id);
                              return next;
                            })
                          }
                          className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                        {item.ten_vi_tri}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            title="Sửa đơn vị"
                            aria-label={`Sửa đơn vị ${item.ten_vi_tri}`}
                            onClick={() => openEditModal(item)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-500 dark:text-gray-400 dark:hover:bg-white/5"
                          >
                            <PencilIcon />
                          </button>
                          <Popconfirm
                            message={`Bạn có chắc muốn xóa bản ghi"${item.ten_vi_tri}"?`}
                            onConfirm={() =>
                              deleteVitrilapdat([item.id], false)
                            }
                            disabled={isDeleting}
                          >
                            <button
                              type="button"
                              title="Xóa đơn vị"
                              aria-label={`Xóa đơn vị ${item.ten_vi_tri}`}
                              disabled={isDeleting}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-error-50 hover:text-error-500 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-error-500/10"
                            >
                              <TrashBinIcon />
                            </button>
                          </Popconfirm>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>
                Hiển thị {firstVisibleVitrilapdat}-{lastVisibleVitrilapdat}{" "}
                trong tổng số {totalVitrilapdats} Vị trí
              </span>
              <label htmlFor="vi-tri-page-size" className="ms-2">
                Số dòng:
              </label>
              <select
                id="vi-tri-page-size"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
                className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            {totalPages > 1 && (
              <Pagination
                currentPage={activePage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  setSelectedIds(new Set());
                }}
                previousLabel="Trước"
                nextLabel="Sau"
              />
            )}
          </div>
        </ComponentCard>
      </div>

      <ViTriLapDatModal
        isOpen={isModalOpen}
        isEditing={editingVitrilapdat !== null}
        ten_vi_tri={editingVitrilapdat?.ten_vi_tri ?? ""}
        error={error}
        isSaving={isSaving}
        className="max-w-xl p-5 sm:p-7"
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </>
  );
}
