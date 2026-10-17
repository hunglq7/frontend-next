"use client";

import { Modal } from "@/components/ui/modal";
import type { FormEvent } from "react";

type KhuvucModalProps = {
  isOpen: boolean;
  isEditing: boolean;
  ma_khu_vuc: string;
  ten_khu_vuc: string;
  error: string | null;
  isSaving: boolean;
  onClose: () => void;
  onCodeChange: (ma_khu_vuc: string) => void;
  onNameChange: (ten_khu_vuc: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function KhuvucModal({
  isOpen,
  isEditing,
  ma_khu_vuc,
  ten_khu_vuc,
  error,
  isSaving,
  onClose,
  onCodeChange,
  onNameChange,
  onSubmit,
}: KhuvucModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl p-5 sm:p-7">
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="khuvuc-ma_khu_vuc"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
          >
            Mã khu vực
          </label>
          <input
            id="khuvuc-ma_khu_vuc"
            autoFocus
            required
            minLength={2}
            maxLength={2}
            value={ma_khu_vuc}
            onChange={(event) => onCodeChange(event.target.value)}
            disabled={isSaving}
            placeholder="Nhập đúng 2 ký tự"
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {isEditing ? "Sửa khu vực" : "Thêm khu vực"}
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
            htmlFor="khuvuc-ten_khu_vuc"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
          >
            Tên khu vực
          </label>
          <input
            id="khuvuc-ten_khu_vuc"
            required
            maxLength={255}
            value={ten_khu_vuc}
            onChange={(event) => onNameChange(event.target.value)}
            disabled={isSaving}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
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
              : isEditing
                ? "Lưu thay đổi"
                : "Thêm khu vực"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
