"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { PlusIcon, TrashBinIcon } from "@/icons";
import { apiClient, getApiErrorMessage } from "@/lib/api-client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type User = { id: number; name: string; email: string };
type Role = { id: number; name: string };
type UserRole = {
  id: number;
  idUser: number;
  idRole: number;
  user: User;
  role: Role;
};

const selectClassName =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function UserRoleManager() {
  const [assignments, setAssignments] = useState<UserRole[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [idUser, setIdUser] = useState("");
  const [idRole, setIdRole] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [assignmentResponse, userResponse, roleResponse] = await Promise.all([
        apiClient.get<UserRole[]>("/user-roles"),
        apiClient.get<User[]>("/users"),
        apiClient.get<Role[]>("/roles"),
      ]);
      setAssignments(assignmentResponse.data);
      setUsers(userResponse.data);
      setRoles(roleResponse.data);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Không thể tải dữ liệu phân quyền"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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
    setIsSaving(true);
    setError(null);
    try {
      await apiClient.post("/user-roles", {
        idUser: Number(idUser),
        idRole: Number(idRole),
      });
      setIsModalOpen(false);
      await loadData();
      window.dispatchEvent(new Event("account-profile-updated"));
      toast.success("Đã gán vai trò cho tài khoản");
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Không thể gán vai trò"));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAssignment = async (assignment: UserRole) => {
    if (deletingId !== null) return;
    if (!window.confirm(`Xóa vai trò ${assignment.role.name} khỏi ${assignment.user.name}?`)) return;
    setDeletingId(assignment.id);
    setError(null);
    try {
      await apiClient.delete(`/user-roles/${assignment.id}`);
      await loadData();
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
          <Button size="sm" onClick={openCreate} startIcon={<PlusIcon />}>Gán vai trò</Button>
        </div>
        {error && !isModalOpen && (
          <div role="alert" className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400">{error}</div>
        )}
        <ComponentCard title="Vai trò của tài khoản">
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
        </ComponentCard>
      </div>
      <Modal isOpen={isModalOpen} onClose={closeModal} className="max-w-xl p-5 sm:p-7">
        <form onSubmit={createAssignment} className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Gán vai trò</h2>
          {error && <div role="alert" className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400">{error}</div>}
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
            <Button size="sm" type="submit" disabled={isSaving || users.length === 0 || roles.length === 0}>{isSaving ? "Đang lưu..." : "Lưu"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
