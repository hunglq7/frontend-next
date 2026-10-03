"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Pagination from "@/components/tables/Pagination";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { PlusIcon, TrashBinIcon } from "@/icons";
import { getApiErrorMessage } from "@/lib/api-client";
import {
  useAssignUserRole,
  useDeleteUserRole,
  useUserRoleList,
  useUserRoleOptions,
} from "@/hooks/use-user-roles";
import type { UserRole } from "@/services/user-roles.service";
import type { Account } from "@/services/users.service";
import type { Role } from "@/services/roles.service";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const selectClassName =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function UserRoleManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [idUser, setIdUser] = useState("");
  const [idRole, setIdRole] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const listQuery = useUserRoleList({
    page: currentPage,
    limit: pageSize,
    search: debouncedSearch,
  });
  const optionsQuery = useUserRoleOptions();
  const assignMutation = useAssignUserRole();
  const deleteMutation = useDeleteUserRole();
  const assignments = listQuery.data?.data ?? [];
  const users: Account[] = optionsQuery.data?.[0] ?? [];
  const roles: Role[] = optionsQuery.data?.[1] ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.max(listQuery.data?.totalPages ?? 0, 1);
  const activePage = listQuery.data?.page ?? currentPage;
  const isLoading = listQuery.isPending || listQuery.isPlaceholderData;
  const isSaving = assignMutation.isPending;
  const listError = listQuery.error
    ? getApiErrorMessage(listQuery.error, "Không thể tải dữ liệu phân quyền")
    : null;
  const optionsError = optionsQuery.error
    ? getApiErrorMessage(optionsQuery.error, "Không thể tải danh sách tài khoản/vai trò")
    : null;

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setDebouncedSearch(searchTerm.trim()),
      300,
    );
    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  const openCreate = () => {
    setIdUser(users[0] ? String(users[0].id) : "");
    setIdRole(roles[0] ? String(roles[0].id) : "");
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setIdUser("");
    setIdRole("");
  };

  const createAssignment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!idUser || !idRole) {
      setError("Vui lòng chọn tài khoản và vai trò");
      return;
    }
    setError(null);
    try {
      await assignMutation.mutateAsync({
        idUser: Number(idUser),
        idRole: Number(idRole),
      });
      setIsModalOpen(false);
      window.dispatchEvent(new Event("account-profile-updated"));
      toast.success("Đã gán vai trò cho tài khoản");
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Không thể gán vai trò"));
    }
  };

  const deleteAssignment = async (assignment: UserRole) => {
    if (deletingId !== null) return;
    if (!window.confirm(`Xóa vai trò ${assignment.role.name} khỏi ${assignment.user.name}?`)) return;
    setError(null);
    try {
      setDeletingId(assignment.id);
      await deleteMutation.mutateAsync(assignment.id);
      window.dispatchEvent(new Event("account-profile-updated"));
      toast.success("Đã xóa phân quyền");
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Không thể xóa phân quyền"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Phân quyền tài khoản" />
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={openCreate}
            disabled={optionsQuery.isPending || Boolean(optionsError)}
            startIcon={<PlusIcon />}
          >
            Gán vai trò
          </Button>
        </div>
        {(error || listError || optionsError) && !isModalOpen && (
          <div role="alert" className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400">{error ?? listError ?? optionsError}</div>
        )}
        <ComponentCard title="Vai trò của tài khoản">
          <div className="mb-4">
            <input
              type="search"
              aria-label="Tìm kiếm phân quyền"
              placeholder="Tìm theo tên, email hoặc vai trò..."
              maxLength={255}
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
              className={selectClassName}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-150 text-start">
              <thead className="border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Tài khoản</th>
                  <th className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Email</th>
                  <th className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Vai trò</th>
                  <th className="w-20 px-4 py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {isLoading ? (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">Đang tải danh sách...</td></tr>
                ) : assignments.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">Chưa có phân quyền nào</td></tr>
                ) : assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50 dark:hover:bg-white/3">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">{assignment.user?.name ?? `User #${assignment.idUser}`}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{assignment.user?.email ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{assignment.role?.name ?? `Role #${assignment.idRole}`}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button type="button" title="Xóa phân quyền" aria-label={`Xóa quyền ${assignment.role?.name ?? ""} của ${assignment.user?.name ?? ""}`} onClick={() => void deleteAssignment(assignment)} disabled={deletingId !== null} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-error-50 hover:text-error-500 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-error-500/10"><TrashBinIcon /></button>
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
                {Math.min(activePage * pageSize, total)} trong tổng số {total} phân quyền
              </span>
              <label htmlFor="user-role-page-size" className="ms-2">Số dòng:</label>
              <select
                id="user-role-page-size"
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
        <form onSubmit={createAssignment} className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Gán vai trò</h2>
          {(error || optionsError) && <div role="alert" className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400">{error ?? optionsError}</div>}
          <label className="block space-y-2 text-sm text-gray-700 dark:text-gray-300">
            Tài khoản
            <select className={selectClassName} value={idUser} onChange={(event) => setIdUser(event.target.value)} required>
              {users.map((user) => <option key={user.id} value={user.id}>{user.name} ({user.email})</option>)}
            </select>
          </label>
          <label className="block space-y-2 text-sm text-gray-700 dark:text-gray-300">
            Vai trò
            <select className={selectClassName} value={idRole} onChange={(event) => setIdRole(event.target.value)} required>
              {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
          </label>
          <div className="flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={closeModal}>Hủy</Button>
            <Button size="sm" type="submit" disabled={isSaving || optionsQuery.isPending || users.length === 0 || roles.length === 0}>{isSaving ? "Đang lưu..." : "Lưu"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
