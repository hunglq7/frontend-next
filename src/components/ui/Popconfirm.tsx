"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  cloneElement,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";

interface PopconfirmProps {
  children: ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>;
  message: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
  confirmText?: string;
  cancelText?: string;
}

export default function Popconfirm({
  children,
  message,
  onConfirm,
  disabled = false,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
}: PopconfirmProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      const popover = popoverRef.current;
      if (!trigger || !popover) return;

      const triggerRect = trigger.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();
      const margin = 8;
      let top = triggerRect.bottom + margin;
      if (top + popoverRect.height > window.innerHeight - margin) {
        top = Math.max(margin, triggerRect.top - popoverRect.height - margin);
      }

      setPosition({
        top,
        left: Math.max(
          margin,
          Math.min(
            triggerRect.right - popoverRect.width,
            window.innerWidth - popoverRect.width - margin,
          ),
        ),
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        !triggerRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const popover =
    isOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={popoverRef}
            role="alertdialog"
            aria-label="Xác nhận xóa"
            className="fixed z-99999 w-64 rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-900"
            style={{ top: position.top, left: position.left }}
          >
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {message}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  void onConfirm();
                }}
                className="rounded-lg bg-error-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-error-600"
              >
                {confirmText}
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  const handleTriggerClick = (event: MouseEvent<HTMLButtonElement>) => {
    children.props.onClick?.(event);
    if (!event.defaultPrevented && !disabled) {
      setIsOpen((open) => !open);
    }
  };

  return (
    <>
      <span ref={triggerRef} className="inline-flex">
        {cloneElement(children, {
          onClick: handleTriggerClick,
          disabled: disabled || children.props.disabled,
          "aria-haspopup": "dialog",
          "aria-expanded": isOpen,
        })}
      </span>
      {popover}
    </>
  );
}
