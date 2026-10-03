"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { apiClient, getApiErrorMessage } from "@/lib/api-client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

type Role = {
  id: number;
  name: string;
};

const inputClassName =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function RoleManager() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRoles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<Role[]>("/roles");
      setRoles(response.data);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Không thể tải danh sách vai trò"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

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

    setIsSaving(true);
    setError(null);
    try {
      if (editingRole) {
        await apiClient.patch(`/roles/${editingRole.id}`, { name: normalizedName });
      } else {
        await apiClient.post("/roles", { name: normalizedName });
      }
      setIsModalOpen(false);
      setEditingRole(null);
      setName("");
      await loadRoles();
      toast.success(editingRole ? "Đã cập nhật vai trò" : "Đã thêm vai trò");
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Không thể lưu vai trò"));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRole = async (role: Role) => {
    if (deletingId !== null) return;
    if (!window.confirm(`Bạn có chắc muốn xóa vai trò ${role.name}?`)) return;
    setDeletingId(role.id);
    setError(null);
    try {
      await apiClient.delete(`/roles/${role.id}`);
      await loadRoles();
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

        {error && !isModalOpen && (
          <div role="alert" className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}

        <ComponentCard title="Danh sách vai trò">
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
