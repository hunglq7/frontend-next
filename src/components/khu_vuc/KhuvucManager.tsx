"use client";
import ComponentCard from "@/components/common/ComponentCard";
import ExportExcelButton from "@/components/common/ExportExcelButton";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import KhuvucModal from "@/components/khu_vuc/KhuvucModal";
import Pagination from "@/components/tables/Pagination";
import Button from "@/components/ui/button/Button";
import Popconfirm from "@/components/ui/Popconfirm";
import { PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { apiClient, getApiErrorMessage } from "@/lib/api-client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import Alert from "../ui/alert/Alert";
type KhuVuc = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

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

async function requestKhuvucs(): Promise<KhuVuc[]> {
  const response = await apiClient.get<KhuVuc[]>("/khuvucs");
  return response.data;
}

export default function KhuvucManager() {
  const [khuvucs, setKhuvucs] = useState<KhuVuc[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [editingKhuvuc, setEditingKhuvuc] = useState<KhuVuc | null>(null);
  const [name, setName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadKhuvucs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setKhuvucs(await requestKhuvucs());
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
    void loadKhuvucs();
  }, [loadKhuvucs]);

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingKhuvuc(null);
    setName("");
  };
  const openCreateModal = () => {
    setEditingKhuvuc(null);
    setName("");
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (khuvuc: KhuVuc) => {
    setEditingKhuvuc(khuvuc);
    setName(khuvuc.name);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Vui lòng nhập tên khu vực");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const response = editingKhuvuc
        ? await apiClient.patch(`/khuvucs/${editingKhuvuc.id}`, {
            name: trimmedName,
          })
        : await apiClient.post("/khuvucs", { name: trimmedName });
      toast.success(response.data.message);
      setIsModalOpen(false);
      setEditingKhuvuc(null);
      setName("");
      await loadKhuvucs();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Không thể lưu khu vực"));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteKhuvucs = async (ids: number[], bulk: boolean) => {
    if (ids.length === 0 || isDeleting) return;

    setIsDeleting(true);
    setError(null);
    try {
      const response = bulk
        ? await apiClient.delete("/khuvucs", { data: { ids } })
        : await apiClient.delete(`/khuvucs/${ids[0]}`);

      toast.success(response.data.message);
      await loadKhuvucs();
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Không thể xóa khu vực"));
    } finally {
      setIsDeleting(false);
    }
  };
  const normalizedSearchTerm = normalizeSearchText(searchTerm);
  const filteredKhuvucs = khuvucs.filter((unit) =>
    normalizeSearchText(unit.name).includes(normalizedSearchTerm),
  );
  const totalPages = Math.max(1, Math.ceil(filteredKhuvucs.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const pageKhuvucs = filteredKhuvucs.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize,
  );
  const firstVisibleUnit =
    filteredKhuvucs.length === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const lastVisibleUnit = Math.min(
    activePage * pageSize,
    filteredKhuvucs.length,
  );
  const allPageUnitsSelected =
    pageKhuvucs.length > 0 &&
    pageKhuvucs.every((unit) => selectedIds.has(unit.id));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return (
    <>
      <PageBreadcrumb pageTitle="Khu vực" />
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            type="search"
            aria-label="Tìm kiếm khu vực"
            placeholder="Tìm kiếm khu vực..."
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
            className="h-11 w-full max-w-sm rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-500"
          />
          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.size > 0 && (
              <Popconfirm
                message={`Bạn có chắc muốn xóa ${selectedIds.size} khu vực đã chọn?`}
                onConfirm={() => deleteKhuvucs([...selectedIds], true)}
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

            <Button
              size="sm"
              onClick={openCreateModal}
              startIcon={<PlusIcon />}
            >
              Thêm mới
            </Button>
            <ExportExcelButton
              data={filteredKhuvucs}
              fileName="khu-vuc"
              sheetName="Khu vực"
              columns={[
                { header: "Mã khu vực", value: (unit) => unit.id },
                { header: "Tên khu vực", value: (unit) => unit.name },
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

        {error && !isModalOpen && (
          <Alert
            variant="error"
            title="Error Message"
            message={error}
            showLink={false}
          />
        )}

        <ComponentCard title="Cập nhật khu vực">
          <div className="overflow-x-auto">
            <table className="w-full min-w-150 text-start">
              <thead className="border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Chọn tất cả khu vực"
                      checked={allPageUnitsSelected}
                      onChange={(event) =>
                        setSelectedIds((previous) => {
                          const next = new Set(previous);
                          pageKhuvucs.forEach((unit) => {
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
                    Tên khu vực
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
                ) : filteredKhuvucs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      {searchTerm
                        ? "Không tìm thấy khu vực phù hợp"
                        : "Chưa có khu vực nào"}
                    </td>
                  </tr>
                ) : (
                  pageKhuvucs.map((unit) => (
                    <tr
                      key={unit.id}
                      className="hover:bg-gray-50 dark:hover:bg-white/3"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Chọn khu vực ${unit.name}`}
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
                            title="Sửa khu vực"
                            aria-label={`Sửa khu vực ${unit.name}`}
                            onClick={() => openEditModal(unit)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-500 dark:text-gray-400 dark:hover:bg-white/5"
                          >
                            <PencilIcon />
                          </button>
                          <Popconfirm
                            message={`Bạn có chắc muốn xóa khu vực "${unit.name}"?`}
                            onConfirm={() => deleteKhuvucs([unit.id], false)}
                            disabled={isDeleting}
                          >
                            <button
                              type="button"
                              title="Xóa khu vực"
                              aria-label={`Xóa khu vực ${unit.name}`}
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
                {filteredKhuvucs.length} khu vực
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

      <KhuvucModal
        isOpen={isModalOpen}
        isEditing={editingKhuvuc !== null}
        name={name}
        error={error}
        isSaving={isSaving}
        onClose={closeModal}
        onNameChange={setName}
        onSubmit={handleSubmit}
      />
    </>
  );
}
