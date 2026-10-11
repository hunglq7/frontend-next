"use client";

import { Modal } from "@/components/ui/modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useEffect } from "react";
import { formSchema, type FormData } from "./vitrilapdatSchema";
import Label from "../form/Label";
import Input from "../form/input/InputField";

type DonViModalProps = {
  isOpen: boolean;
  isEditing: boolean;
  ma_vi_tri_lap_dat: string;
  ten_vi_tri: string;
  error: string | null;
  isSaving: boolean;
  className?: string;
  onClose: () => void;
  onSubmit: (data: FormData) => void | Promise<void>;
};

export default function VitrilapdatModal({
  isOpen,
  isEditing,
  ma_vi_tri_lap_dat,
  ten_vi_tri,
  error,
  isSaving,
  className = "max-w-xl p-5 sm:p-7",
  onClose,
  onSubmit,
}: DonViModalProps) {
  const { control, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { ma_vi_tri_lap_dat, ten_vi_tri },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ ma_vi_tri_lap_dat, ten_vi_tri });
    }
  }, [isOpen, ma_vi_tri_lap_dat, ten_vi_tri, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={className}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {isEditing ? "Sửa vị trí" : "Thêm vị trí"}
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
          <Label htmlFor="ma_vi_tri_lap_dat">Mã vị trí lắp đặt</Label>
          <Controller
            name="ma_vi_tri_lap_dat"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Input
                  {...field}
                  autoFocus
                  minLength={7}
                  maxLength={7}
                  id="ma_vi_tri_lap_dat"
                  placeholder="Nhập đúng 7 ký tự"
                  disabled={isSaving}
                  error={Boolean(fieldState.error)}
                  aria-invalid={Boolean(fieldState.error)}
                  aria-describedby={
                    fieldState.error ? "ma-vi-tri-error" : undefined
                  }
                />
                {fieldState.error && (
                  <p
                    id="ma-vi-tri-error"
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
        <div>
          <Label htmlFor="ten_vi_tri">Tên vị trí</Label>
          <Controller
            name="ten_vi_tri"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Input
                  name={field.name}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  value={field.value}
                  type="text"
                  id="ten_vi_tri"
                  placeholder="Nhập tên vị trí"
                  disabled={isSaving}
                  error={Boolean(fieldState.error)}
                  aria-invalid={Boolean(fieldState.error)}
                  aria-describedby={
                    fieldState.error ? "ten-vi-tri-error" : undefined
                  }
                />
                {fieldState.error && (
                  <p
                    id="ten-vi-tri-error"
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
