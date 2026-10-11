"use client";

import { Modal } from "@/components/ui/modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useEffect } from "react";
import { formSchema, type FormData } from "./donviSchema";
import Label from "../form/Label";
import Input from "../form/input/InputField";

const fields: {
  name: keyof FormData;
  label: string;
  placeholder: string;
  maxLength: number;
}[] = [
  {
    name: "ma_don_vi",
    label: "Mã đơn vị",
    placeholder: "Nhập mã đơn vị",
    maxLength: 3,
  },
  {
    name: "ten_don_vi",
    label: "Tên đơn vị",
    placeholder: "Nhập tên đơn vị",
    maxLength: 100,
  },
];

type DonViModalProps = {
  isOpen: boolean;
  isEditing: boolean;
  initialValues: FormData;
  fieldErrors: Partial<Record<keyof FormData, string>>;
  error: string | null;
  isSaving: boolean;
  className?: string;
  onClose: () => void;
  onFieldChange: (field: keyof FormData) => void;
  onSubmit: (data: FormData) => void | Promise<void>;
};

export default function DonViModal({
  isOpen,
  isEditing,
  initialValues,
  fieldErrors,
  error,
  isSaving,
  className = "max-w-xl p-5 sm:p-7",
  onClose,
  onFieldChange,
  onSubmit,
}: DonViModalProps) {
  const { control, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (isOpen) {
      reset(initialValues);
    }
  }, [isOpen, initialValues, reset]);

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

        {fields.map(({ name, label, placeholder, maxLength }, index) => {
          const inputId = `don-vi-${name}`;
          const errorId = `${inputId}-error`;
          const fieldError = fieldErrors[name];

          return (
            <div key={name}>
              <Label htmlFor={inputId}>{label}</Label>
              <Controller
                name={name}
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <Input
                      {...field}
                      onChange={(event) => {
                        field.onChange(event);
                        onFieldChange(name);
                      }}
                      id={inputId}
                      placeholder={placeholder}
                      maxLength={maxLength}
                      autoFocus={index === 0}
                      disabled={isSaving}
                      error={Boolean(fieldState.error || fieldError)}
                      aria-invalid={Boolean(fieldState.error || fieldError)}
                      aria-describedby={
                        fieldState.error || fieldError ? errorId : undefined
                      }
                    />
                    {(fieldState.error || fieldError) && (
                      <p
                        id={errorId}
                        role="alert"
                        className="mt-1.5 text-xs text-error-500"
                      >
                        {fieldState.error?.message ?? fieldError}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
          );
        })}

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
