"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Pagination from "@/components/tables/Pagination";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { getApiErrorMessage } from "@/lib/api-client";
import { useDeleteRole, useRoleList, useSaveRole } from "@/hooks/use-roles";
import type { Role } from "@/services/roles.service";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

const inputClassName =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function RoleManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const listQuery = useRoleList({
    page: currentPage,
    limit: pageSize,
    search: debouncedSearch,
  });
  const saveMutation = useSaveRole();
  const deleteMutation = useDeleteRole();
  const roles = listQuery.data?.data ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.max(listQuery.data?.totalPages ?? 0, 1);
  const activePage = listQuery.data?.page ?? currentPage;
  const isLoading = listQuery.isPending || listQuery.isPlaceholderData;
  const isSaving = saveMutation.isPending;
  const listError = listQuery.error
    ? getApiErrorMessage(listQuery.error, "Không thể tải danh sách vai trò")
    : null;

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setDebouncedSearch(searchTerm.trim()),
      300,
    );
    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  const openCreate = () => {
    setEditingRole(null);
    setName("");
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setName(role.name);
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingRole(null);
    setName("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = name.trim();
    if (!normalizedName) {
      setError("Vui lòng nhập tên vai trò");
      return;
    }

    setError(null);
    try {
      await saveMutation.mutateAsync({
        id: editingRole?.id ?? null,
        name: normalizedName,
      });
      setIsModalOpen(false);
      setEditingRole(null);
      setName("");
      toast.success(editingRole ? "Đã cập nhật vai trò" : "Đã thêm vai trò");
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Không thể lưu vai trò"));
    }
  };

  const deleteRole = async (role: Role) => {
    if (deletingId !== null) return;
    if (!window.confirm(`Bạn có chắc muốn xóa vai trò ${role.name}?`)) return;
    setError(null);
    try {
      setDeletingId(role.id);
      await deleteMutation.mutateAsync(role.id);
      toast.success(`Đã xóa vai trò ${role.name}`);
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Không thể xóa vai trò"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Vai trò" />
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button size="sm" onClick={openCreate} startIcon={<PlusIcon />}>
            Thêm vai trò
          </Button>
        </div>

        {(error || listError) && !isModalOpen && (
          <div role="alert" className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400">
            {error ?? listError}
          </div>
        )}

        <ComponentCard title="Danh sách vai trò">
          <div className="mb-4">
            <input
              type="search"
              aria-label="Tìm kiếm vai trò"
              placeholder="Tìm kiếm vai trò..."
              maxLength={255}
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
              className={inputClassName}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-120 text-start">
              <thead className="border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">ID</th>
                  <th className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Tên vai trò</th>
                  <th className="w-28 px-4 py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {isLoading ? (
                  <tr><td colSpan={3} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">Đang tải danh sách...</td></tr>
                ) : roles.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">Chưa có vai trò nào</td></tr>
                ) : roles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-white/3">
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{role.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">{role.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button type="button" title="Sửa vai trò" aria-label={`Sửa vai trò ${role.name}`} onClick={() => openEdit(role)} disabled={role.name === "admin" || role.name === "user"} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-500 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-white/5"><PencilIcon /></button>
                        <button type="button" title="Xóa vai trò" aria-label={`Xóa vai trò ${role.name}`} onClick={() => void deleteRole(role)} disabled={deletingId !== null || role.name === "admin" || role.name === "user"} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-error-50 hover:text-error-500 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-error-500/10"><TrashBinIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-col gap-4 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>
                Hiển thị {total === 0 ? 0 : (activePage - 1) * pageSize + 1}-
                {Math.min(activePage * pageSize, total)} trong tổng số {total} vai trò
              </span>
              <label htmlFor="role-page-size" className="ms-2">Số dòng:</label>
              <select
                id="role-page-size"
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
      <Modal isOpen={isModalOpen} onClose={closeModal} className="max-w-xl p-5 sm:p-7">
        <form onSubmit={handleSubmit} className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">{editingRole ? "Sửa vai trò" : "Thêm vai trò"}</h2>
          {error && <div role="alert" className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400">{error}</div>}
          <label className="block space-y-2 text-sm text-gray-700 dark:text-gray-300">
            Tên vai trò
            <input className={inputClassName} value={name} maxLength={50} onChange={(event) => setName(event.target.value)} required />
          </label>
          <div className="flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={closeModal}>Hủy</Button>
            <Button size="sm" type="submit" disabled={isSaving}>{isSaving ? "Đang lưu..." : "Lưu"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
