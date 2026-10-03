"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Pagination from "@/components/tables/Pagination";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { getApiErrorMessage } from "@/lib/api-client";
import { useDeleteAccount, useSaveAccount, useUserList } from "@/hooks/use-users";
import type { Account } from "@/services/users.service";
import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

type AccountForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
};

const emptyForm: AccountForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  password: "",
};

const inputClassName =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-500";

export default function UserManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const listQuery = useUserList({
    page: currentPage,
    limit: pageSize,
    search: debouncedSearch,
  });
  const saveMutation = useSaveAccount();
  const deleteMutation = useDeleteAccount();
  const accounts = listQuery.data?.data ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.max(listQuery.data?.totalPages ?? 0, 1);
  const activePage = listQuery.data?.page ?? currentPage;
  const isLoading = listQuery.isPending || listQuery.isPlaceholderData;
  const isSaving = saveMutation.isPending;
  const listError = listQuery.error
    ? getApiErrorMessage(listQuery.error, "Không thể tải danh sách tài khoản")
    : null;

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setDebouncedSearch(searchTerm.trim()),
      300,
    );
    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const previewUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [avatarFile]);

  const resetForm = () => {
    setEditingAccount(null);
    setForm(emptyForm);
    setAvatarFile(null);
    setAvatarPreview(null);
    setError(null);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    resetForm();
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    setForm({
      name: account.name,
      email: account.email,
      phone: account.phone,
      address: account.address,
      password: "",
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("name", form.name.trim());
    formData.append("email", form.email.trim());
    formData.append("phone", form.phone.trim());
    formData.append("address", form.address.trim());
    if (form.password) formData.append("password", form.password);
    if (avatarFile) formData.append("avatar", avatarFile);

    try {
      const isEditing = editingAccount !== null;
      await saveMutation.mutateAsync({
        id: editingAccount?.id ?? null,
        formData,
      });

      setIsModalOpen(false);
      resetForm();
      if (isEditing) {
        window.dispatchEvent(new Event("account-profile-updated"));
      }
      toast.success(
        isEditing ? "Đã cập nhật tài khoản" : "Đã thêm tài khoản mới",
      );
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Không thể lưu tài khoản"));
    }
  };

  const deleteAccount = async (account: Account) => {
    if (deletingId !== null) return;
    if (!window.confirm(`Bạn có chắc muốn xóa tài khoản ${account.name}?`))
      return;

    setError(null);
    try {
      setDeletingId(account.id);
      await deleteMutation.mutateAsync(account.id);
      window.dispatchEvent(new Event("account-profile-updated"));
      toast.success(`Đã xóa tài khoản ${account.name}`);
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Không thể xóa tài khoản"));
    } finally {
      setDeletingId(null);
    }
  };

  const pageAccounts = accounts;
  const firstVisible =
    total === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const lastVisible = Math.min(activePage * pageSize, total);

  return (
    <>
      <PageBreadcrumb pageTitle="Tài khoản" />
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            type="search"
            aria-label="Tìm kiếm tài khoản"
            placeholder="Tìm theo tên, email hoặc số điện thoại..."
            maxLength={255}
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
            className={`${inputClassName} max-w-lg`}
          />
          <Button size="sm" onClick={openCreateModal} startIcon={<PlusIcon />}>
            Thêm tài khoản
          </Button>
        </div>

        {(error || listError) && !isModalOpen && (
          <div
            role="alert"
            className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400"
          >
            {error ?? listError}
          </div>
        )}

        <ComponentCard title="Danh sách tài khoản">
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-start">
              <thead className="border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                    Tài khoản
                  </th>
                  <th className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </th>
                  <th className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                    Điện thoại
                  </th>
                  <th className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                    Địa chỉ
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
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      Đang tải danh sách...
                    </td>
                  </tr>
                ) : pageAccounts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      {searchTerm
                        ? "Không tìm thấy tài khoản phù hợp"
                        : "Chưa có tài khoản nào"}
                    </td>
                  </tr>
                ) : (
                  pageAccounts.map((account) => (
                    <tr
                      key={account.id}
                      className="hover:bg-gray-50 dark:hover:bg-white/3"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                            <Image
                              fill
                              unoptimized
                              src={
                                account.avatar
                                  ? `/api${account.avatar}`
                                  : "/images/user/user-01.jpg"
                              }
                              alt={account.name}
                              sizes="40px"
                              className="object-cover"
                            />
                          </span>
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {account.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {account.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {account.phone}
                      </td>
                      <td className="max-w-60 truncate px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {account.address}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            title="Sửa tài khoản"
                            aria-label={`Sửa tài khoản ${account.name}`}
                            onClick={() => openEditModal(account)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-500 dark:text-gray-400 dark:hover:bg-white/5"
                          >
                            <PencilIcon />
                          </button>
                          <button
                            type="button"
                            title="Xóa tài khoản"
                            aria-label={`Xóa tài khoản ${account.name}`}
                            onClick={() => void deleteAccount(account)}
                            disabled={deletingId !== null}
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
                Hiển thị {firstVisible}-{lastVisible} trong tổng số{" "}
                {total} tài khoản
              </span>
              <label htmlFor="account-page-size" className="ms-2">
                Số dòng:
              </label>
              <select
                id="account-page-size"
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
      #modal for creating/editing account
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        className="max-w-xl p-5 sm:p-7"
      >
        <form
          onSubmit={handleSubmit}
          className="max-h-[85vh] space-y-5 overflow-y-auto"
        >
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {editingAccount ? "Sửa tài khoản" : "Thêm tài khoản"}
          </h2>
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400"
            >
              {error}
            </div>
          )}
          <div className="flex items-center gap-4">
            <span className="relative size-16 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <Image
                fill
                unoptimized
                src={
                  avatarPreview ??
                  (editingAccount?.avatar
                    ? `/api${editingAccount.avatar}`
                    : "/images/user/user-01.jpg")
                }
                alt="Xem trước ảnh đại diện"
                sizes="64px"
                className="object-cover"
              />
            </span>
            <label className="block min-w-0 text-sm font-medium text-gray-700 dark:text-gray-300">
              Ảnh đại diện
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(event) =>
                  setAvatarFile(event.target.files?.[0] ?? null)
                }
                className="mt-2 block w-full text-sm text-gray-500 file:me-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-medium file:text-brand-600 dark:file:bg-brand-500/10 dark:file:text-brand-400"
              />
              <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                JPEG, PNG, WEBP hoặc GIF, tối đa 5 MB
              </span>
            </label>
          </div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Họ và tên
            <input
              required
              maxLength={255}
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              className={`${inputClassName} mt-1.5`}
            />
          </label>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              className={`${inputClassName} mt-1.5`}
            />
          </label>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Số điện thoại
            <input
              required
              value={form.phone}
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value })
              }
              className={`${inputClassName} mt-1.5`}
            />
          </label>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Địa chỉ
            <input
              required
              value={form.address}
              onChange={(event) =>
                setForm({ ...form, address: event.target.value })
              }
              className={`${inputClassName} mt-1.5`}
            />
          </label>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Mật khẩu{" "}
            {editingAccount && (
              <span className="font-normal text-gray-500">
                (để trống nếu không đổi)
              </span>
            )}
            <input
              required={!editingAccount}
              minLength={6}
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
              className={`${inputClassName} mt-1.5`}
            />
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={isSaving}
              className="h-11 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {isSaving ? "Đang lưu..." : "Lưu tài khoản"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
