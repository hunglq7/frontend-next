"use client";

import { Modal } from "@/components/ui/modal";
import type { FormEvent } from "react";
import Label from "../form/Label";
import Input from "../form/input/InputField";

type DonViTinhModalProps = {
  isOpen: boolean;
  isEditing: boolean;
  ten_don_vi_tinh: string;
  error: string | null;
  isSaving: boolean;
  onClose: () => void;
  onNameChange: (ten_don_vi_tinh: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function DonViTinhModal({
  isOpen,
  isEditing,
  ten_don_vi_tinh,
  error,
  isSaving,
  onClose,
  onNameChange,
  onSubmit,
}: DonViTinhModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl p-5 sm:p-7">
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {isEditing ? "Sửa đơn vị tính" : "Thêm đơn vị tính"}
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
          <Label htmlFor="don-vi-ten_don_vi_tinh">Tên đơn vị tính</Label>
          <Input
            onChange={(event) => onNameChange(event.target.value)}
            required
            autoFocus
            value={ten_don_vi_tinh}
            type="text"
            id="don-vi-ten_don_vi_tinh"
            placeholder="Nhập tên đơn vị tính"
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
            {isSaving ? "Đang lưu..." : isEditing ? "Lưu thay đổi" : "Thêm mới"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
