"use client";

import Alert from "@/components/ui/alert/Alert";
import Pagination from "@/components/tables/Pagination";
import { getApiErrorMessage } from "@/lib/api-client";
import type { EntityRecord } from "./EntityManager";

type EntityLookupPickerProps = {
  title: string;
  codeLabel: string;
  nameLabel: string;
  codeField: string;
  nameField: string;
  disabledRecordId?: number;
  searchTerm: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  records: EntityRecord[];
  isPending: boolean;
  error: unknown;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSelect: (record: EntityRecord) => void;
};

export default function EntityLookupPicker({
  title,
  codeLabel,
  nameLabel,
  codeField,
  nameField,
  disabledRecordId,
  searchTerm,
  page,
  limit,
  total,
  totalPages,
  records,
  isPending,
  error,
  onSearchChange,
  onPageChange,
  onLimitChange,
  onSelect,
}: EntityLookupPickerProps) {
  return (
    <div className="space-y-4 rounded-lg border border-gray-200 p-3 dark:border-gray-800 sm:p-4">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
        {title}
      </h3>
      <input
        type="search"
        aria-label={`Tìm theo ${codeLabel.toLowerCase()} hoặc ${nameLabel.toLowerCase()}`}
        placeholder={`Tìm theo ${codeLabel.toLowerCase()} hoặc ${nameLabel.toLowerCase()}...`}
        value={searchTerm}
        maxLength={255}
        onChange={(event) => onSearchChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
      />
      {error !== null && error !== undefined && (
        <Alert
          variant="error"
          title={`Lỗi tải ${title.toLowerCase()}`}
          message={getApiErrorMessage(error, `Không thể tải ${title.toLowerCase()}`)}
          showLink={false}
        />
      )}
      <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
        <table className="w-full min-w-130 text-start">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
            <tr>
              <th className="w-1/3 px-4 py-3 text-start text-sm font-medium text-gray-600 dark:text-gray-300">
                {codeLabel}
              </th>
              <th className="px-4 py-3 text-start text-sm font-medium text-gray-600 dark:text-gray-300">
                {nameLabel}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isPending ? (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-sm">
                  Đang tải {title.toLowerCase()}...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-sm">
                  Không tìm thấy kết quả phù hợp
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr
                  key={record.id}
                  aria-disabled={record.id === disabledRecordId}
                  className={
                    record.id === disabledRecordId
                      ? "cursor-not-allowed bg-gray-50 text-gray-400 dark:bg-gray-800/50"
                      : "cursor-pointer hover:bg-brand-50 dark:hover:bg-white/5"
                  }
                  onClick={() =>
                    record.id !== disabledRecordId && onSelect(record)
                  }
                >
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {String(record[codeField] ?? "")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {String(record[nameField] ?? "")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Tổng {total} kết quả</span>
          <label htmlFor={`${title}-picker-limit`} className="ms-2">
            Số dòng:
          </label>
          <select
            id={`${title}-picker-limit`}
            value={limit}
            onChange={(event) => onLimitChange(Number(event.target.value))}
            className="h-9 rounded-lg border border-gray-300 bg-white px-2 dark:border-gray-700 dark:bg-gray-800"
          >
            {[10, 15, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            previousLabel="Trước"
            nextLabel="Sau"
          />
        )}
      </div>
    </div>
  );
}
