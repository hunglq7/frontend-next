"use client";

import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import { useEffect, useRef } from "react";
import { CalenderIcon } from "../../icons";
import Label from "./Label";
import Hook = flatpickr.Options.Hook;
import DateOption = flatpickr.Options.DateOption;
import Instance = flatpickr.Instance;

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: Hook | Hook[];
  defaultDate?: DateOption;
  label?: string;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
};

export default function DatePicker({
  id,
  mode,
  onChange,
  label,
  defaultDate,
  placeholder,
  value,
  onValueChange,
  disabled = false,
  required = false,
}: PropsType) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<Instance | null>(null);
  const onChangeRef = useRef(onChange);
  const onValueChangeRef = useRef(onValueChange);

  useEffect(() => {
    onChangeRef.current = onChange;
    onValueChangeRef.current = onValueChange;
  }, [onChange, onValueChange]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const flatPickr = flatpickr(input, {
      mode: mode || "single",
      static: true,
      monthSelectorType: "static",
      dateFormat: "Y-m-d",
      onChange: (dates, currentDateString, instance) => {
        const callbacks = onChangeRef.current;
        if (Array.isArray(callbacks)) {
          callbacks.forEach((callback) =>
            callback(dates, currentDateString, instance),
          );
        } else {
          callbacks?.(dates, currentDateString, instance);
        }
        onValueChangeRef.current?.(currentDateString);
      },
    });
    pickerRef.current = flatPickr;

    return () => {
      flatPickr.destroy();
      pickerRef.current = null;
    };
  }, [id, mode]);

  useEffect(() => {
    pickerRef.current?.setDate(value || defaultDate || "", false);
  }, [defaultDate, value]);

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="relative">
        <input
          id={id}
          ref={inputRef}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
        />

        <span className="inset-e-3 pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
          <CalenderIcon className="size-6" />
        </span>
      </div>
    </div>
  );
}
