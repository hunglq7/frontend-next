"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Pagination from "@/components/tables/Pagination";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { apiClient, getApiErrorMessage } from "@/lib/api-client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
type DonVi = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

function getMessage(payload: unknown, fallback: string) {
  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const message = payload.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(", ");
  }
  return fallback;
}

async function requestUnits(): Promise<DonVi[]> {
  const response = await apiClient.get<DonVi[]>("/donvis");
  return response.data;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("vi")
    .replace(/đ/g, "d");
}

export default function DonViManager() {
  const [units, setUnits] = useState<DonVi[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [editingUnit, setEditingUnit] = useState<DonVi | null>(null);
  const [name, setName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadUnits = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setUnits(await requestUnits());
      setSelectedIds(new Set());
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Có lỗi xảy ra",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUnits();
  }, [loadUnits]);

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingUnit(null);
    setName("");
  };

  const openCreateModal = () => {
    setEditingUnit(null);
    setName("");
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (unit: DonVi) => {
    setEditingUnit(unit);
    setName(unit.name);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Vui lòng nhập tên đơn vị");
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      const successMessage = editingUnit
        ? `Sửa bản ghi thành công: ${trimmedName}`
        : `Thêm mới thành công: ${trimmedName}`;

      if (editingUnit) {
        await apiClient.patch(`/donvis/${editingUnit.id}`, {
          name: trimmedName,
        });
      } else {
        await apiClient.post("/donvis", { name: trimmedName });
      }

      setIsModalOpen(false);
      setEditingUnit(null);
      setName("");
      await loadUnits();
      toast.success(successMessage);
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Không thể lưu đơn vị"));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteUnits = async (ids: number[], bulk: boolean) => {
    if (ids.length === 0 || isDeleting) return;
    const confirmation = bulk
      ? `Bạn có chắc muốn xóa ${ids.length} đơn vị đã chọn?`
      : "Bạn có chắc muốn xóa đơn vị này?";
    if (!window.confirm(confirmation)) return;

    setIsDeleting(true);
    setError(null);
    setNotice(null);
    try {
      const response = bulk
        ? await apiClient.delete("/donvis", { data: { ids } })
        : await apiClient.delete(`/donvis/${ids[0]}`);

      setNotice(
        getMessage(
          response.data,
          bulk ? "Đã xóa các đơn vị đã chọn" : "Đã xóa đơn vị",
        ),
      );
      await loadUnits();
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Không thể xóa đơn vị"));
    } finally {
      setIsDeleting(false);
    }
  };

  const normalizedSearchTerm = normalizeSearchText(searchTerm);
  const filteredUnits = units.filter((unit) =>
    normalizeSearchText(unit.name).includes(normalizedSearchTerm),
  );
  const totalPages = Math.max(1, Math.ceil(filteredUnits.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const pageUnits = filteredUnits.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize,
  );
  const firstVisibleUnit =
    filteredUnits.length === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const lastVisibleUnit = Math.min(activePage * pageSize, filteredUnits.length);
  const allPageUnitsSelected =
    pageUnits.length > 0 && pageUnits.every((unit) => selectedIds.has(unit.id));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return (
    <>
      <PageBreadcrumb pageTitle="Đơn vị" />
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            type="search"
            aria-label="Tìm kiếm đơn vị"
            placeholder="Tìm kiếm đơn vị..."
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
            className="h-11 w-full max-w-sm rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-500"
          />
          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={() => void deleteUnits([...selectedIds], true)}
                disabled={isDeleting}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-error-300 px-4 py-2 text-sm font-medium text-error-600 hover:bg-error-50 disabled:opacity-50 dark:border-error-800 dark:text-error-400 dark:hover:bg-error-500/10"
              >
                <TrashBinIcon />
                Xóa dòng chọn({selectedIds.size})
              </button>
            )}
            <Button
              size="sm"
              onClick={openCreateModal}
              startIcon={<PlusIcon />}
            >
              Thêm mới
            </Button>
          </div>
        </div>

        {error && !isModalOpen && (
          <div
            role="alert"
            className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400"
          >
            {error}
          </div>
        )}
        {notice && (
          <div
            role="status"
            className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-800 dark:bg-success-500/10 dark:text-success-400"
          >
            {notice}
          </div>
        )}

        <ComponentCard title="Cập nhật đơn vị">
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
                          pageUnits.forEach((unit) => {
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
                    Tên đơn vị
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
                ) : filteredUnits.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      {searchTerm
                        ? "Không tìm thấy đơn vị phù hợp"
                        : "Chưa có đơn vị nào"}
                    </td>
                  </tr>
                ) : (
                  pageUnits.map((unit) => (
                    <tr
                      key={unit.id}
                      className="hover:bg-gray-50 dark:hover:bg-white/3"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Chọn đơn vị ${unit.name}`}
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
                        {unit.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(unit.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            title="Sửa đơn vị"
                            aria-label={`Sửa đơn vị ${unit.name}`}
                            onClick={() => openEditModal(unit)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-500 dark:text-gray-400 dark:hover:bg-white/5"
                          >
                            <PencilIcon />
                          </button>
                          <button
                            type="button"
                            title="Xóa đơn vị"
                            aria-label={`Xóa đơn vị ${unit.name}`}
                            onClick={() => void deleteUnits([unit.id], false)}
                            disabled={isDeleting}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-error-50 hover:text-error-500 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-error-500/10"
                          >
                            <TrashBinIcon />
                          </button>
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
                {filteredUnits.length} đơn vị
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
                onPageChange={setCurrentPage}
                previousLabel="Trước"
                nextLabel="Sau"
              />
            )}
          </div>
        </ComponentCard>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        className="max-w-xl p-5 sm:p-7"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {editingUnit ? "Sửa đơn vị" : "Thêm đơn vị"}
            </h2>
          </div>
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400"
            >
              {error}
            </div>
          )}
          <div>
            <label
              htmlFor="don-vi-name"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
            >
              Tên đơn vị
            </label>
            <input
              id="don-vi-name"
              autoFocus
              required
              maxLength={255}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeModal}
              disabled={isSaving}
              className="h-11 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/3"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-11 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {isSaving
                ? "Đang lưu..."
                : editingUnit
                  ? "Lưu thay đổi"
                  : "Thêm đơn vị"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
