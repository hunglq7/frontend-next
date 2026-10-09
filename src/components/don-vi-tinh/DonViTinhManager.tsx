"use client";

import ComponentCard from "@/components/common/ComponentCard";
import ExportExcelButton from "@/components/common/ExportExcelButton";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import DonViTinhModal from "@/components/don-vi-tinh/DonViTinhModal";
import Pagination from "@/components/tables/Pagination";
import Button from "@/components/ui/button/Button";
import Popconfirm from "@/components/ui/Popconfirm";
import { PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { getApiErrorMessage } from "@/lib/api-client";
import {
  useDeleteDonViTinh,
  useDonViTinhList,
  useSaveDonViTinh,
} from "@/hooks/use-don-vi-tinh";
import {
  getAllMatchingDonViTinh,
  type DonViTinh,
} from "@/services/don-vi-tinh.service";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import Alert from "../ui/alert/Alert";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}

export default function DonViTinhManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const donvitinhsQuery = useDonViTinhList({
    page: currentPage,
    limit: pageSize,
    search: debouncedSearch,
  });
  const pageResult = donvitinhsQuery.data;
  const donvitinhs = pageResult?.data ?? [];
  const isLoading =
    donvitinhsQuery.isPending || donvitinhsQuery.isPlaceholderData;
  const listError = donvitinhsQuery.error
    ? getApiErrorMessage(
        donvitinhsQuery.error,
        "Không thể tải danh sách đơn vị",
      )
    : null;
  const activePage = pageResult?.page ?? currentPage;
  const totalPages = Math.max(pageResult?.totalPages ?? 0, 1);
  const totalDonvitinhs = pageResult?.total ?? 0;
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [editingDonvitinh, setEditingDonvitinh] = useState<DonViTinh | null>(
    null,
  );
  const [ten_don_vi_tinh, setName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  const saveMutation = useSaveDonViTinh();
  const deleteMutation = useDeleteDonViTinh();
  const isSaving = saveMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const [error, setError] = useState<string | null>(null);

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingDonvitinh(null);
    setName("");
  };

  const openCreateModal = () => {
    setEditingDonvitinh(null);
    setName("");
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (donvitinh: DonViTinh) => {
    setEditingDonvitinh(donvitinh);
    setName(donvitinh.ten_don_vi_tinh);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = ten_don_vi_tinh.trim();
    if (!trimmedName) {
      setError("Vui lòng nhập tên đơn vị tính");
      return;
    }
    setError(null);
    try {
      const response = await saveMutation.mutateAsync({
        donvitinhId: editingDonvitinh?.id ?? null,
        ten_don_vi_tinh: trimmedName,
      });

      setSelectedIds(new Set());
      toast.success(response.data.message);
      setIsModalOpen(false);
      setEditingDonvitinh(null);
      setName("");
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Không thể lưu đơn vị tính"));
    }
  };

  const deleteDonvitinhs = async (ids: number[], bulk: boolean) => {
    if (ids.length === 0 || isDeleting) return;
    setError(null);
    try {
      const response = await deleteMutation.mutateAsync({ ids, bulk });
      setSelectedIds(new Set());
      toast.success(response.data.message);
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Không thể xóa đơn vị tính"));
    }
  };

  const firstVisibleUnit =
    totalDonvitinhs === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const lastVisibleUnit = Math.min(activePage * pageSize, totalDonvitinhs);
  const allPageUnitsSelected =
    donvitinhs.length > 0 &&
    donvitinhs.every((donvitinh) => selectedIds.has(donvitinh.id));
  return (
    <>
      <PageBreadcrumb pageTitle="Đơn vị tính" />
      <div className="space-y-6">
        {/* Tìm Kiếm */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            type="search"
            aria-label="Tìm kiếm đơn vị tính"
            placeholder="Tìm kiếm đơn vị tính..."
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
                message={`Bạn có chắc muốn xóa ${selectedIds.size} đơn vị tính đã chọn?`}
                onConfirm={() => deleteDonvitinhs([...selectedIds], true)}
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

            {/* Thêm mới */}
            <Button
              size="sm"
              onClick={openCreateModal}
              startIcon={<PlusIcon />}
            >
              Thêm mới
            </Button>
            {/* Xuất Excel */}
            <ExportExcelButton
              data={donvitinhs}
              loadData={() => getAllMatchingDonViTinh(debouncedSearch)}
              fileName="don-vi-tinh"
              sheetName="Đơn vị tính"
              columns={[
                { header: "Mã đơn vị", value: (unit) => unit.id },
                { header: "Tên đơn vị", value: (unit) => unit.ten_don_vi_tinh },
                {
                  header: "Ngày tạo",
                  value: (unit) => formatDate(unit.createdAt),
                },
                {
                  header: "Ngày cập nhật",
                  value: (unit) => formatDate(unit.updatedAt),
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
        <ComponentCard title="Cập nhật đơn vị tính">
          <div className="overflow-x-auto">
            <table className="w-full min-w-150 text-start">
              <thead className="border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Chọn tất cả đơn vị"
                      checked={allPageUnitsSelected}
                      onChange={(event) =>
                        setSelectedIds((previous) => {
                          const next = new Set(previous);
                          donvitinhs.forEach((unit) => {
                            if (event.target.checked) next.add(unit.id);
                            else next.delete(unit.id);
                          });
                          return next;
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-start text-theme-xs font-bold text-gray-500 dark:text-gray-400">
                    Tên đơn vị tính
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
                ) : donvitinhs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      {searchTerm
                        ? "Không tìm thấy đơn vị tính phù hợp"
                        : "Chưa có đơn vị tính nào"}
                    </td>
                  </tr>
                ) : (
                  donvitinhs.map((unit) => (
                    <tr
                      key={unit.id}
                      className="hover:bg-gray-50 dark:hover:bg-white/3"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Chọn đơn vị tính ${unit.ten_don_vi_tinh}`}
                          checked={selectedIds.has(unit.id)}
                          onChange={(event) =>
                            setSelectedIds((previous) => {
                              const next = new Set(previous);
                              if (event.target.checked) next.add(unit.id);
                              else next.delete(unit.id);
                              return next;
                            })
                          }
                          className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                        {unit.ten_don_vi_tinh}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(unit.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            title="Sửa đơn vị tính"
                            aria-label={`Sửa đơn vị tính ${unit.ten_don_vi_tinh}`}
                            onClick={() => openEditModal(unit)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-500 dark:text-gray-400 dark:hover:bg-white/5"
                          >
                            <PencilIcon />
                          </button>
                          <Popconfirm
                            message={`Bạn có chắc muốn xóa đơn vị tính "${unit.ten_don_vi_tinh}"?`}
                            onConfirm={() => deleteDonvitinhs([unit.id], false)}
                            disabled={isDeleting}
                          >
                            <button
                              type="button"
                              title="Xóa đơn vị tính"
                              aria-label={`Xóa đơn vị tính ${unit.ten_don_vi_tinh}`}
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
                Hiển thị {firstVisibleUnit}-{lastVisibleUnit} trong tổng số{" "}
                {totalDonvitinhs} đơn vị tính
              </span>
              <label htmlFor="don-vi-page-size" className="ms-2">
                Số dòng:
              </label>
              <select
                id="don-vi-page-size"
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

      <DonViTinhModal
        isOpen={isModalOpen}
        isEditing={editingDonvitinh !== null}
        ten_don_vi_tinh={ten_don_vi_tinh}
        error={error}
        isSaving={isSaving}
        onClose={closeModal}
        onNameChange={setName}
        onSubmit={handleSubmit}
      />
    </>
  );
}
