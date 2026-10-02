"use client";

import { Modal } from "@/components/ui/modal";
import type { FormEvent } from "react";

type DonViModalProps = {
  isOpen: boolean;
  isEditing: boolean;
  name: string;
  error: string | null;
  isSaving: boolean;
  onClose: () => void;
  onNameChange: (name: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function DonViModal({
  isOpen,
  isEditing,
  name,
  error,
  isSaving,
  onClose,
  onNameChange,
  onSubmit,
}: DonViModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-xl p-5 sm:p-7"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {isEditing ? "Sửa đơn vị" : "Thêm đơn vị"}
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
            onChange={(event) => onNameChange(event.target.value)}
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
                : "Thêm đơn vị"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
