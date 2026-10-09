"use client";

import { Modal } from "@/components/ui/modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useEffect } from "react";
import { formSchema, type FormData } from "./donviSchema";
import Label from "../form/Label";
import Input from "../form/input/InputField";

type DonViModalProps = {
  isOpen: boolean;
  isEditing: boolean;
  ten_don_vi: string;
  error: string | null;
  isSaving: boolean;
  className?: string;
  onClose: () => void;
  onSubmit: (data: FormData) => void | Promise<void>;
};

export default function DonViModal({
  isOpen,
  isEditing,
  ten_don_vi,
  error,
  isSaving,
  className = "max-w-xl p-5 sm:p-7",
  onClose,
  onSubmit,
}: DonViModalProps) {
  const { control, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { ten_don_vi },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ ten_don_vi });
    }
  }, [isOpen, ten_don_vi, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={className}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          <Label htmlFor="don-vi-ten_don_vi">Tên đơn vị</Label>
          <Controller
            name="ten_don_vi"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Input
                  name={field.name}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  autoFocus
                  value={field.value}
                  type="text"
                  id="don-vi-ten_don_vi"
                  placeholder="Nhập tên đơn vị"
                  disabled={isSaving}
                  error={Boolean(fieldState.error)}
                  aria-invalid={Boolean(fieldState.error)}
                  aria-describedby={
                    fieldState.error ? "don-vi-ten_don_vi-error" : undefined
                  }
                />
                {fieldState.error && (
                  <p
                    id="don-vi-ten_don_vi-error"
                    role="alert"
                    className="mt-1.5 text-xs text-error-500"
                  >
                    {fieldState.error.message}
                  </p>
                )}
              </>
            )}
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
