"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Popconfirm from "@/components/ui/Popconfirm";
import Pagination from "@/components/tables/Pagination";
import { CopyIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { apiClient, getApiErrorMessage } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useEffect, useId, useState, type FormEvent } from "react";
import { toast } from "sonner";
import Alert from "../ui/alert/Alert";
import DatePicker from "@/components/form/date-picker";
import ExportExcelButton from "@/components/common/ExportExcelButton";
import EntityLookupPicker from "./EntityLookupPicker";

export type EntityField = {
  name: string;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  tableOnly?: boolean;
  fullWidth?: boolean;
  formSpan?: 1 | 2 | 3 | 4;
  maxLength?: number;
  exactLength?: number;
  tableWidth?: number;
  type?: "text" | "number" | "date" | "textarea" | "boolean";
  lookup?: {
    endpoint: string;
    valueField: string;
    labelField: string;
    picker?: {
      codeField: string;
      nameField: string;
      title?: string;
      codeLabel?: string;
      nameLabel?: string;
      inline?: boolean;
      recordLabelField?: string;
    };
  };
};

export type EntityDateRangeFilter = {
  dateFromField: string;
  dateToField: string;
  organizationField: string;
  organizationEndpoint: string;
  organizationLabelField: string;
  defaultToday?: boolean;
};

export type EntityRecord = {
  id: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

type EntityPage = {
  data: EntityRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type EntityRowAction = {
  label: string;
  path: string;
  method: "post" | "patch";
  confirm?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: "key" | "undo";
  invalidateEndpoints?: string[];
  visibleWhen?: {
    field: string;
    value: unknown;
    invert?: boolean;
  };
};

export type EntityManagerProps = {
  endpoint: string;
  title: string;
  fields: EntityField[];
  tableFields?: readonly string[];
  autoSizeTable?: boolean;
  columnFilters?: boolean;
  showSearch?: boolean;
  tree?: {
    parentField: string;
  };
  rowActions?: EntityRowAction[];
  allowEdit?: boolean;
  allowDelete?: boolean;
  allowCreate?: boolean;
  allowCopy?: boolean;
  copyExcludedFields?: string[];
  showSequence?: boolean;
  actionsLabel?: string;
  disableEditDeleteWhen?: {
    field: string;
    value: unknown;
  };
  formColumns?: 1 | 2 | 3 | 4;
  details?: {
    endpoint: string;
    title: string;
    fields: EntityField[];
    tableFields?: readonly string[];
    tree?: {
      parentField: string;
    };
    allowBulkDelete?: boolean;
    allowExport?: boolean;
    copyExcludedFields?: string[];
    disableEditDeleteWhen?: {
      field: string;
      value: unknown;
    };
  };
  embedded?: boolean;
  allowBulkDelete?: boolean;
  allowExport?: boolean;
  dateRangeFilter?: EntityDateRangeFilter;
  invalidateEndpoints?: string[];
};

function emptyDraft(fields: EntityField[]) {
  return Object.fromEntries(fields.map(({ name }) => [name, ""]));
}

function displayValue(value: unknown, type?: EntityField["type"]) {
  if (value === null || value === undefined || value === "") return "-";
  if (type !== "date" || typeof value !== "string") return String(value);
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}

function toInputValue(field: EntityField, value: unknown) {
  if (value === null || value === undefined) return "";
  if (field.type === "date" && typeof value === "string") {
    return value.slice(0, 10);
  }
  if (field.type === "boolean") return value ? "true" : "false";
  return String(value);
}

function getFieldError(error: unknown) {
  if (!isAxiosError(error)) return null;
  const payload: unknown = error.response?.data;
  if (typeof payload !== "object" || payload === null) return null;
  const { field, message } = payload as {
    field?: unknown;
    message?: unknown;
  };
  return typeof field === "string" && typeof message === "string"
    ? { field, message }
    : null;
}

export default function EntityManager({
  endpoint,
  title,
  fields,
  tableFields,
  autoSizeTable = false,
  columnFilters = false,
  showSearch = true,
  tree,
  rowActions = [],
  allowEdit = true,
  allowDelete = true,
  allowCreate = true,
  allowCopy = false,
  copyExcludedFields = [],
  showSequence = true,
  actionsLabel = "Thao tác",
  disableEditDeleteWhen,
  formColumns = 1,
  details,
  embedded = false,
  allowBulkDelete = false,
  allowExport = false,
  dateRangeFilter,
  invalidateEndpoints = [],
}: EntityManagerProps) {
  const displayedFields = tableFields
    ? tableFields
        .map((name) => fields.find((field) => field.name === name))
        .filter((field): field is EntityField => field !== undefined)
    : fields;
  const lookupFields = tableFields
    ? [...fields, ...displayedFields]
    : fields;
  const formGridClass = {
    1: "space-y-5",
    2: "grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2",
    3: "grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-3",
    4: "grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-4",
  }[formColumns];
  const queryClient = useQueryClient();
  const formId = useId();
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [searchTerm, setSearchTerm] = useState("");
  const [search, setSearch] = useState("");
  const [columnFilterDraft, setColumnFilterDraft] = useState<
    Record<string, string>
  >({});
  const [columnFiltersApplied, setColumnFiltersApplied] = useState<
    Record<string, string>
  >({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [editing, setEditing] = useState<EntityRecord | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>(
    () => emptyDraft(fields),
  );
  const [isOpen, setIsOpen] = useState(false);
  const [copying, setCopying] = useState<EntityRecord | null>(null);
  const [detailsRecord, setDetailsRecord] = useState<EntityRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [tablePickerField, setTablePickerField] = useState<EntityField | null>(
    null,
  );
  const [pickerSearchTerm, setPickerSearchTerm] = useState("");
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerPage, setPickerPage] = useState(1);
  const [pickerLimit, setPickerLimit] = useState(10);
  const [expandedTreeRows, setExpandedTreeRows] = useState<Set<number>>(
    () => new Set(),
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const initialFilterDate = dateRangeFilter?.defaultToday ? todayString : "";
  const [draftDateFrom, setDraftDateFrom] = useState(initialFilterDate);
  const [draftDateTo, setDraftDateTo] = useState(initialFilterDate);
  const [draftOrganizationId, setDraftOrganizationId] = useState("");
  const [appliedDateFrom, setAppliedDateFrom] = useState(initialFilterDate);
  const [appliedDateTo, setAppliedDateTo] = useState(initialFilterDate);
  const [appliedOrganizationId, setAppliedOrganizationId] = useState("");
  const lockedRowField = disableEditDeleteWhen?.field;
  const lockedRowValue = disableEditDeleteWhen?.value;
  const getPickerEndpoint = (field: EntityField) =>
    field.lookup?.endpoint === "$current"
      ? endpoint
      : field.lookup?.endpoint ?? "";
  const selectedPickerField = fields.find((field) => field.lookup?.picker);
  const invalidateEntityQueries = () =>
    Promise.all(
      [endpoint, ...invalidateEndpoints].map((queryEndpoint) =>
        queryClient.invalidateQueries({
          queryKey: ["entity-manager", queryEndpoint],
        }),
      ),
    );
  const dateFilterParams = () =>
    dateRangeFilter
      ? {
          [dateRangeFilter.dateFromField]: appliedDateFrom || undefined,
          [dateRangeFilter.dateToField]: appliedDateTo || undefined,
          [dateRangeFilter.organizationField]:
            appliedOrganizationId || undefined,
        }
      : {};

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchTerm.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [searchTerm]);
  useEffect(() => {
    const timeout = window.setTimeout(
      () => setColumnFiltersApplied(columnFilterDraft),
      300,
    );
    return () => window.clearTimeout(timeout);
  }, [columnFilterDraft]);
  useEffect(() => {
    const timeout = window.setTimeout(
      () => setPickerSearch(pickerSearchTerm.trim()),
      300,
    );
    return () => window.clearTimeout(timeout);
  }, [pickerSearchTerm]);

  const listQuery = useQuery({
    queryKey: [
      "entity-manager",
      endpoint,
      page,
      limit,
      search,
      columnFiltersApplied,
      appliedDateFrom,
      appliedDateTo,
      appliedOrganizationId,
    ],
    queryFn: async () => {
      const response = await apiClient.get<EntityPage>(endpoint, {
        params: {
          page,
          limit,
          search: search || undefined,
          ...Object.fromEntries(
            Object.entries(columnFiltersApplied)
              .filter(([, value]) => value.trim())
              .map(([field, value]) => [`filter_${field}`, value.trim()]),
          ),
          ...dateFilterParams(),
        },
      });
      return response.data;
    },
  });
  const lookupsQuery = useQuery({
    queryKey: [
      "entity-manager-lookups",
      lookupFields.map((field) => field.lookup?.endpoint).filter(Boolean),
    ],
    queryFn: async () => {
      const lookups = Array.from(
        new Set(
          lookupFields
            .filter((field) => !field.lookup?.picker)
            .map((field) => field.lookup?.endpoint)
            .filter((lookup): lookup is string => Boolean(lookup)),
        ),
      );
      const results = await Promise.all(
        lookups.map(async (lookup) => {
          const firstPage = await apiClient.get<EntityPage>(lookup, {
            params: { page: 1, limit: 100 },
          });
          const options = [...firstPage.data.data];
          for (
            let lookupPage = 2;
            lookupPage <= firstPage.data.totalPages;
            lookupPage += 1
          ) {
            const response = await apiClient.get<EntityPage>(lookup, {
              params: { page: lookupPage, limit: 100 },
            });
            options.push(...response.data.data);
          }
          return [lookup, options] as const;
        }),
      );
      return Object.fromEntries(results);
    },
    enabled:
      (isOpen || displayedFields.some((field) => field.lookup)) &&
      lookupFields.some((field) => field.lookup && !field.lookup.picker),
  });
  const pickerQuery = useQuery({
    queryKey: [
      "entity-picker",
      tablePickerField ? getPickerEndpoint(tablePickerField) : "",
      pickerPage,
      pickerLimit,
      pickerSearch,
    ],
    queryFn: async () => {
      const response = await apiClient.get<EntityPage>(
        getPickerEndpoint(tablePickerField!),
        {
          params: {
            page: pickerPage,
            limit: pickerLimit,
            search: pickerSearch || undefined,
          },
        },
      );
      return response.data;
    },
    enabled: tablePickerField !== null,
  });
  const selectedPickerQuery = useQuery({
    queryKey: [
      "entity-picker-selected",
      selectedPickerField ? getPickerEndpoint(selectedPickerField) : "",
      draft[selectedPickerField?.name ?? ""] ?? "",
    ],
    queryFn: async () => {
      const pickerField = selectedPickerField!;
      const selectedId = draft[pickerField.name];
      if (!selectedId) return null;
      const response = await apiClient.get<EntityRecord>(
        `${getPickerEndpoint(pickerField)}/${selectedId}`,
      );
      return response.data;
    },
    enabled:
      isOpen &&
      selectedPickerField !== undefined &&
      Boolean(draft[selectedPickerField.name]),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) =>
      apiClient.delete(`${endpoint}/bulk`, { data: { ids } }),
    onSuccess: async (response) => {
      await invalidateEntityQueries();
      setSelectedIds(new Set());
      toast.success(response.data.message ?? "Đã xóa các dòng đã chọn");
    },
    onError: (deleteError) =>
      setError(getApiErrorMessage(deleteError, `Không thể xóa ${title}`)),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      editing
        ? apiClient.patch(`${endpoint}/${editing.id}`, payload)
        : apiClient.post(endpoint, payload),
    onSuccess: async (response) => {
      await invalidateEntityQueries();
      toast.success(response.data.message ?? "Đã lưu thành công");
      setIsOpen(false);
    },
    onError: (saveError) => {
      const fieldError = getFieldError(saveError);
      if (fieldError) {
        setFieldErrors({ [fieldError.field]: fieldError.message });
      } else {
        setError(getApiErrorMessage(saveError, `Không thể lưu ${title}`));
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiClient.delete(`${endpoint}/${id}`),
    onSuccess: async (response) => {
      await invalidateEntityQueries();
      toast.success(response.data.message ?? "Đã xóa thành công");
    },
    onError: (deleteError) =>
      setError(getApiErrorMessage(deleteError, `Không thể xóa ${title}`)),
  });

  const copyMutation = useMutation({
    mutationFn: async (record: EntityRecord) => {
      const payload = Object.fromEntries(
        fields
          .filter(
            (field) =>
              !field.readOnly &&
              !field.tableOnly &&
              !copyExcludedFields.includes(field.name),
          )
          .map((field) => [field.name, record[field.name] ?? null]),
      );
      return apiClient.post(endpoint, payload);
    },
    onSuccess: async (response) => {
      await invalidateEntityQueries();
      setPage(Math.max(1, Math.ceil((total + 1) / limit)));
      toast.success(response.data.message ?? "Đã sao chép thành công");
      setCopying(null);
    },
    onError: (copyError) => {
      setCopying(null);
      setError(getApiErrorMessage(copyError, `Không thể sao chép ${title}`));
    },
  });

  const runAction = async (
    record: EntityRecord,
    action: EntityRowAction,
  ) => {
    try {
      const path = action.path.replace("{id}", String(record.id));
      const response =
        action.method === "post"
          ? await apiClient.post(path)
          : await apiClient.patch(path);
      await Promise.all(
        [endpoint, ...(action.invalidateEndpoints ?? [])].map(
          (queryEndpoint) =>
            queryClient.invalidateQueries({
              queryKey: ["entity-manager", queryEndpoint],
            }),
        ),
      );
      toast.success(response.data.message ?? "Đã cập nhật thành công");
    } catch (actionError) {
      setError(getApiErrorMessage(actionError, "Không thể thực hiện thao tác"));
    }
  };

  const records = listQuery.data?.data ?? [];
  const total = listQuery.data?.total ?? 0;
  const activePage = listQuery.data?.page ?? page;
  const totalPages = Math.max(listQuery.data?.totalPages ?? 1, 1);
  const allPageRecordsSelected =
    records.some((record) => !isRowActionDisabled(record)) &&
    records
      .filter((record) => !isRowActionDisabled(record))
      .every((record) => selectedIds.has(record.id));
  const visibleRecords = (() => {
    if (!tree) return records;
    const recordsByParent = new Map<number | null, EntityRecord[]>();
    const recordIds = new Set(records.map((record) => record.id));
    records.forEach((record) => {
      const rawParentId = record[tree.parentField];
      const parentId =
        typeof rawParentId === "number" && recordIds.has(rawParentId)
          ? rawParentId
          : null;
      const siblings = recordsByParent.get(parentId) ?? [];
      siblings.push(record);
      recordsByParent.set(parentId, siblings);
    });

    const visible: EntityRecord[] = [];
    const appendChildren = (parentId: number | null) => {
      (recordsByParent.get(parentId) ?? []).forEach((record) => {
        visible.push(record);
        if (expandedTreeRows.has(record.id)) appendChildren(record.id);
      });
    };
    appendChildren(null);
    return visible;
  })();
  const treeChildren = new Map<number, EntityRecord[]>();
  if (tree) {
    records.forEach((record) => {
      const parentId = record[tree.parentField];
      if (typeof parentId !== "number") return;
      const children = treeChildren.get(parentId) ?? [];
      children.push(record);
      treeChildren.set(parentId, children);
    });
  }
  function isRowActionDisabled(record: EntityRecord) {
    return Boolean(
      disableEditDeleteWhen &&
        record[disableEditDeleteWhen.field] === disableEditDeleteWhen.value,
    );
  }
  useEffect(() => {
    const lockedIds = records
      .filter(
        (record) =>
          lockedRowField !== undefined &&
          record[lockedRowField] === lockedRowValue,
      )
      .map((record) => record.id);
    if (!lockedIds.length) return;
    setSelectedIds((previous) => {
      const next = new Set(previous);
      lockedIds.forEach((id) => next.delete(id));
      return next;
    });
  }, [records, lockedRowField, lockedRowValue]);

  const loadAllRecords = async () => {
    const firstPage = await apiClient.get<EntityPage>(endpoint, {
      params: {
        page: 1,
        limit: 100,
        search: search || undefined,
        ...Object.fromEntries(
          Object.entries(columnFiltersApplied)
            .filter(([, value]) => value.trim())
            .map(([field, value]) => [`filter_${field}`, value.trim()]),
        ),
        ...dateFilterParams(),
      },
    });
    const result = [...firstPage.data.data];
    for (let exportPage = 2; exportPage <= firstPage.data.totalPages; exportPage += 1) {
      const response = await apiClient.get<EntityPage>(endpoint, {
        params: {
          page: exportPage,
          limit: 100,
          search: search || undefined,
          ...Object.fromEntries(
            Object.entries(columnFiltersApplied)
              .filter(([, value]) => value.trim())
              .map(([field, value]) => [`filter_${field}`, value.trim()]),
          ),
          ...dateFilterParams(),
        },
      });
      result.push(...response.data.data);
    }
    return result;
  };

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft(fields));
    setError(null);
    setFieldErrors({});
    setIsOpen(true);
  };

  const openEdit = (record: EntityRecord) => {
    setEditing(record);
    setDraft(
      Object.fromEntries(
        fields.map((field) => [
          field.name,
          toInputValue(field, record[field.name]),
        ]),
      ),
    );
    setError(null);
    setFieldErrors({});
    setIsOpen(true);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const missing = fields.find(
      (field) =>
        !field.readOnly && field.required && !draft[field.name]?.trim(),
    );
    if (missing) {
      setError(`${missing.label} không được để trống`);
      return;
    }
    const tooLong = fields.find(
      (field) =>
        field.maxLength &&
        !field.readOnly &&
        draft[field.name] &&
        draft[field.name].length > field.maxLength,
    );
    if (tooLong) {
      setError(`${tooLong.label} không được vượt quá ${tooLong.maxLength} ký tự`);
      return;
    }
    const wrongLength = fields.find(
      (field) =>
        field.exactLength &&
        !field.readOnly &&
        draft[field.name]?.trim().length !== field.exactLength,
    );
    if (wrongLength) {
      setError(`${wrongLength.label} phải có đúng ${wrongLength.exactLength} ký tự`);
      return;
    }
    setError(null);
    const payload = Object.fromEntries(
      fields.map((field) => {
        const value = draft[field.name] ?? "";
        if (field.readOnly) return [field.name, undefined];
        return [
          field.name,
          field.type === "boolean"
            ? value === "true"
            : field.type === "number" || field.lookup
              ? value === ""
                ? null
                : Number(value)
              : value,
        ];
      }),
    );
    saveMutation.mutate(payload);
  };

  const updateField = (name: string, value: string) => {
    setDraft((previous) => ({ ...previous, [name]: value }));
    setFieldErrors((previous) => {
      const next = { ...previous };
      delete next[name];
      return next;
    });
    setError(null);
  };

  return (
    <>
      {!embedded && <PageBreadcrumb pageTitle={title} />}
      <div className="space-y-6">
        <div
          className={`flex flex-wrap items-center gap-3 ${
            showSearch ? "justify-between" : "justify-end"
          }`}
        >
          {showSearch && (
            <input
              type="search"
              aria-label={`Tìm kiếm ${title.toLowerCase()}`}
              placeholder={`Tìm kiếm ${title.toLowerCase()}...`}
              value={searchTerm}
              maxLength={255}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
                setSelectedIds(new Set());
              }}
              className="h-11 w-full max-w-sm rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          )}
          <div className="flex flex-wrap items-center gap-2">
            {allowBulkDelete && selectedIds.size > 0 && (
              <Popconfirm
                message={`Bạn có chắc muốn xóa ${selectedIds.size} ${title.toLowerCase()} đã chọn?`}
                onConfirm={() =>
                  bulkDeleteMutation.mutate([...selectedIds])
                }
                disabled={bulkDeleteMutation.isPending}
              >
                <button
                  type="button"
                  disabled={bulkDeleteMutation.isPending}
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-error-300 px-4 py-2 text-sm font-medium text-error-600 hover:bg-error-50 disabled:opacity-50"
                >
                  <TrashBinIcon />
                  Xóa dòng chọn ({selectedIds.size})
                </button>
              </Popconfirm>
            )}
            {allowExport && (
              <ExportExcelButton
                data={records}
                loadData={loadAllRecords}
                fileName={title.toLowerCase().replace(/\s+/g, "-")}
                sheetName={title}
                columns={[
                  { header: "ID", value: (record) => record.id },
                  ...displayedFields.map((field) => ({
                    header: field.label,
                    value: (record: EntityRecord) => {
                      const rawValue = record[field.name];
                      if (field.type === "boolean") {
                        return rawValue === true ? "Có" : "Không";
                      }
                      if (field.lookup?.picker) {
                        return String(record.deviceName ?? "");
                      }
                      if (field.lookup) {
                        const option = lookupsQuery.data?.[
                          field.lookup.endpoint
                        ]?.find(
                          (item: EntityRecord) =>
                            String(item[field.lookup!.valueField]) ===
                            String(rawValue ?? ""),
                        );
                        return option
                          ? String(option[field.lookup.labelField] ?? "")
                          : "";
                      }
                      return rawValue === null || rawValue === undefined
                        ? ""
                        : String(rawValue);
                    },
                  })),
                ]}
              />
            )}
            {allowCreate && (
              <Button size="sm" onClick={openCreate} startIcon={<PlusIcon />}>
                Thêm mới
              </Button>
            )}
            {dateRangeFilter && (
              <button
                type="button"
                aria-label={`Mở bộ lọc ${title.toLowerCase()}`}
                aria-expanded={isFilterOpen}
                title="Điều kiện tìm kiếm"
                onClick={() => setIsFilterOpen((open) => !open)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border ${
                  isFilterOpen
                    ? "border-brand-500 text-brand-600"
                    : "border-gray-300 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                >
                  <path
                    d="M3 4.5H15M5.5 9H12.5M7.5 13.5H10.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {dateRangeFilter && isFilterOpen && (
          <section
            aria-label="Điều kiện tìm kiếm"
            className="space-y-4 border-b border-gray-100 pb-5 dark:border-gray-800"
          >
            <h2 className="text-sm font-semibold text-brand-600">
              ĐIỀU KIỆN TÌM KIẾM
            </h2>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Phòng ban, đơn vị
              <select
                value={draftOrganizationId}
                onChange={(event) =>
                  setDraftOrganizationId(event.target.value)
                }
                disabled={lookupsQuery.isPending}
                className="mt-1.5 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="">Tất cả đơn vị</option>
                {(lookupsQuery.data?.[dateRangeFilter.organizationEndpoint] ??
                  []).map((organization: EntityRecord) => (
                  <option key={organization.id} value={organization.id}>
                    {String(
                      organization[dateRangeFilter.organizationLabelField] ??
                        "",
                    )}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Từ ngày
                <div className="mt-1.5">
                  <DatePicker
                    id={`${formId}-filter-from`}
                    value={draftDateFrom}
                    onValueChange={setDraftDateFrom}
                    placeholder="Chọn ngày bắt đầu"
                  />
                </div>
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Đến ngày
                <div className="mt-1.5">
                  <DatePicker
                    id={`${formId}-filter-to`}
                    value={draftDateTo}
                    onValueChange={setDraftDateTo}
                    placeholder="Chọn ngày kết thúc"
                  />
                </div>
              </label>
            </div>
            {draftDateFrom && draftDateTo && draftDateFrom > draftDateTo && (
              <p role="alert" className="text-sm text-error-500">
                Ngày bắt đầu không được sau ngày kết thúc.
              </p>
            )}
            <div className="flex justify-end">
              <Button
                size="sm"
                disabled={
                  Boolean(
                    draftDateFrom &&
                      draftDateTo &&
                      draftDateFrom > draftDateTo,
                  ) ||
                  lookupsQuery.isPending
                }
                onClick={() => {
                  setAppliedDateFrom(draftDateFrom);
                  setAppliedDateTo(draftDateTo);
                  setAppliedOrganizationId(draftOrganizationId);
                  setPage(1);
                  setSelectedIds(new Set());
                }}
              >
                Tìm kiếm
              </Button>
            </div>
          </section>
        )}

        {listQuery.error && (
          <Alert
            variant="error"
            title="Lỗi tải dữ liệu"
            message={getApiErrorMessage(
              listQuery.error,
              `Không thể tải ${title.toLowerCase()}`,
            )}
            showLink={false}
          />
        )}
        {error && !isOpen && (
          <Alert
            variant="error"
            title="Lỗi thao tác"
            message={error}
            showLink={false}
          />
        )}

        <ComponentCard title={`Danh sách ${title.toLowerCase()}`}>
          <div
            className={`min-w-0 max-w-full overflow-x-auto ${
              autoSizeTable
                ? "mx-[-4px] w-[calc(100%+8px)] sm:mx-[-12px] sm:w-[calc(100%+24px)]"
                : "w-full"
            }`}
          >
            <table
              className={`w-full text-start ${
                autoSizeTable
                  ? "w-max min-w-full"
                  : tableFields
                    ? "min-w-[1280px] table-fixed"
                    : "min-w-150"
              }`}
            >
              <thead className="border-b border-gray-100 dark:border-gray-800">
                <tr>
                  {allowBulkDelete && (
                    <th className="w-10 px-2 py-2">
                      <input
                        type="checkbox"
                        aria-label={`Chọn tất cả ${title.toLowerCase()} ở trang này`}
                        checked={allPageRecordsSelected}
                        onChange={(event) =>
                          setSelectedIds((previous) => {
                            const next = new Set(previous);
                            records.forEach((record) => {
                              if (isRowActionDisabled(record)) return;
                              if (event.target.checked) next.add(record.id);
                              else next.delete(record.id);
                            });
                            return next;
                          })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-brand-500"
                      />
                    </th>
                  )}
                  {showSequence && (
                    <th
                      style={tableFields ? { width: 85 } : undefined}
                      className={`whitespace-nowrap text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400 ${
                        tableFields ? "px-2 py-2" : "px-4 py-3"
                      }`}
                    >
                      STT
                    </th>
                  )}
                  {displayedFields.map((field) => (
                    <th
                      key={field.name}
                      style={
                        tableFields && field.tableWidth
                          ? { width: field.tableWidth }
                          : undefined
                      }
                      className={`whitespace-nowrap text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400 ${
                        tableFields ? "px-2 py-2" : "px-4 py-3"
                      }`}
                    >
                      {field.label}
                    </th>
                  ))}
                  <th
                    style={
                      tableFields
                        ? {
                            width: details ? 280 : allowCopy ? 155 : 100,
                          }
                        : undefined
                    }
                    className={`sticky right-0 z-20 whitespace-nowrap bg-white text-end text-theme-xs font-medium text-gray-500 shadow-[-8px_0_12px_-10px_rgba(15,23,42,0.55)] dark:bg-gray-900 dark:text-gray-400 ${
                      tableFields ? "px-2 py-2" : "w-28 px-4 py-3"
                    }`}
                  >
                    {actionsLabel}
                  </th>
                </tr>
                {columnFilters && (
                  <tr className="border-t border-gray-100 bg-gray-50/70 dark:border-gray-800 dark:bg-gray-800/30">
                    {allowBulkDelete && (
                      <th className="px-2 py-2" aria-hidden="true" />
                    )}
                    {showSequence && (
                      <th className="px-2 py-2">
                        <input
                          type="search"
                          aria-label="Lọc theo số thứ tự"
                          placeholder="Lọc..."
                          value={columnFilterDraft.id ?? ""}
                          onChange={(event) => {
                            setColumnFilterDraft((previous) => ({
                              ...previous,
                              id: event.target.value,
                            }));
                            setSelectedIds(new Set());
                            setPage(1);
                          }}
                          className="h-8 w-full min-w-14 rounded-md border border-gray-300 bg-white px-2 text-xs dark:border-gray-700 dark:bg-gray-900"
                        />
                      </th>
                    )}
                    {displayedFields.map((field) => (
                      <th key={field.name} className="px-2 py-2">
                        {field.type === "boolean" ? (
                          <select
                            aria-label={`Lọc theo ${field.label}`}
                            value={columnFilterDraft[field.name] ?? ""}
                            onChange={(event) => {
                              setColumnFilterDraft((previous) => ({
                                ...previous,
                                [field.name]: event.target.value,
                              }));
                              setSelectedIds(new Set());
                              setPage(1);
                            }}
                            className="h-8 w-full min-w-20 rounded-md border border-gray-300 bg-white px-2 text-xs dark:border-gray-700 dark:bg-gray-900"
                          >
                            <option value="">Tất cả</option>
                            <option value="Có">Có</option>
                            <option value="Không">Không</option>
                          </select>
                        ) : (
                          <input
                            type={field.type === "date" ? "date" : "search"}
                            aria-label={`Lọc theo ${field.label}`}
                            placeholder="Tìm..."
                            value={columnFilterDraft[field.name] ?? ""}
                            onChange={(event) => {
                              setColumnFilterDraft((previous) => ({
                                ...previous,
                                [field.name]: event.target.value,
                              }));
                              setSelectedIds(new Set());
                              setPage(1);
                            }}
                            className="h-8 w-full min-w-20 rounded-md border border-gray-300 bg-white px-2 text-xs dark:border-gray-700 dark:bg-gray-900"
                          />
                        )}
                      </th>
                    ))}
                    <th
                      className="sticky right-0 z-10 bg-gray-50 px-2 py-2 dark:bg-gray-900"
                      aria-hidden="true"
                    />
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {listQuery.isPending || listQuery.isPlaceholderData ? (
                  <tr>
                    <td
                      colSpan={
                        displayedFields.length +
                        1 +
                        Number(allowBulkDelete) +
                        Number(showSequence)
                      }
                      className="px-4 py-10 text-center"
                    >
                      Đang tải danh sách...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td
                      colSpan={
                        displayedFields.length +
                        1 +
                        Number(allowBulkDelete) +
                        Number(showSequence)
                      }
                      className="px-4 py-10 text-center"
                    >
                      {searchTerm ||
                      Object.values(columnFilterDraft).some((value) => value)
                        ? `Không tìm thấy ${title.toLowerCase()} phù hợp`
                        : `Chưa có ${title.toLowerCase()} nào`}
                    </td>
                  </tr>
                ) : (
                  visibleRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-gray-50 dark:hover:bg-white/3"
                    >
                      {allowBulkDelete && (
                        <td className="px-2 py-2">
                          <input
                            type="checkbox"
                            aria-label={`Chọn dòng ${record.id}`}
                            checked={selectedIds.has(record.id)}
                            disabled={isRowActionDisabled(record)}
                            onChange={(event) =>
                              setSelectedIds((previous) => {
                                const next = new Set(previous);
                                if (event.target.checked) next.add(record.id);
                                else next.delete(record.id);
                                return next;
                              })
                            }
                            className="h-4 w-4 rounded border-gray-300 text-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
                          />
                        </td>
                      )}
                      {showSequence && (
                        <td
                          className={`text-sm text-gray-500 dark:text-gray-400 ${
                            tableFields ? "px-2 py-2" : "px-4 py-3"
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            {tree && (treeChildren.get(record.id)?.length ?? 0) > 0 ? (
                              <button
                                type="button"
                                aria-label={
                                  expandedTreeRows.has(record.id)
                                    ? "Thu gọn danh mục con"
                                    : "Mở rộng danh mục con"
                                }
                                aria-expanded={expandedTreeRows.has(record.id)}
                                onClick={() =>
                                  setExpandedTreeRows((previous) => {
                                    const next = new Set(previous);
                                    if (next.has(record.id)) next.delete(record.id);
                                    else next.add(record.id);
                                    return next;
                                  })
                                }
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
                              >
                                {expandedTreeRows.has(record.id) ? "−" : "+"}
                              </button>
                            ) : tree ? (
                              <span className="inline-block h-6 w-6 shrink-0" />
                            ) : null}
                            {record.id}
                          </div>
                        </td>
                      )}
                      {displayedFields.map((field) => (
                        <td
                          key={field.name}
                          className={`overflow-hidden text-ellipsis whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 ${
                            tableFields ? "px-2 py-2" : "px-4 py-3"
                          }`}
                          title={String(record[field.name] ?? "")}
                        >
                          {field.lookup
                            ? field.lookup.picker
                              ? displayValue(
                                  field.lookup.picker.recordLabelField
                                    ? record[
                                        field.lookup.picker.recordLabelField
                                      ]
                                    : record.deviceName ??
                                        record[field.lookup.picker.nameField],
                                )
                              : displayValue(
                                lookupsQuery.data?.[field.lookup.endpoint]?.find(
                                  (option: EntityRecord) =>
                                    String(option[field.lookup!.valueField]) ===
                                    String(record[field.name] ?? ""),
                                )?.[field.lookup.labelField],
                              )
                            : field.type === "boolean"
                              ? (
                                  <input
                                    type="checkbox"
                                    checked={record[field.name] === true}
                                    disabled
                                    aria-label={`${field.label}: ${
                                      record[field.name] === true ? "Có" : "Không"
                                    }`}
                                    className="h-4 w-4 rounded border-gray-300 text-brand-500"
                                  />
                                )
                              : displayValue(record[field.name], field.type)}
                        </td>
                      ))}
                      <td
                        className={`sticky right-0 z-10 bg-white shadow-[-8px_0_12px_-10px_rgba(15,23,42,0.35)] dark:bg-gray-900 ${
                          tableFields ? "px-2 py-2" : "px-4 py-3"
                        }`}
                      >
                        <div className="flex justify-end gap-2">
                          {allowCopy && (
                            <button
                              type="button"
                              aria-label={`Sao chép ${title.toLowerCase()}`}
                              title="Sao chép"
                              onClick={() => setCopying(record)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-500"
                            >
                              <CopyIcon />
                            </button>
                          )}
                          {allowEdit && !isRowActionDisabled(record) && (
                            <button
                              type="button"
                              aria-label={`Sửa ${title.toLowerCase()}`}
                              onClick={() => openEdit(record)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-500"
                            >
                              <PencilIcon />
                            </button>
                          )}
                          {rowActions
                            .filter(
                              (action) => {
                                if (!action.visibleWhen) return true;
                                const actual =
                                  record[action.visibleWhen.field];
                                const expected = action.visibleWhen.value;
                                const matches = Array.isArray(expected)
                                  ? expected.includes(actual)
                                  : actual === expected;
                                return action.visibleWhen.invert
                                  ? !matches
                                  : matches;
                              },
                            )
                            .map((action) => (
                            <Popconfirm
                              key={action.label}
                              message={action.confirm ?? `Xác nhận ${action.label.toLowerCase()}?`}
                              confirmText={action.confirmText}
                              cancelText={action.cancelText}
                              onConfirm={() => void runAction(record, action)}
                            >
                              <button
                                type="button"
                                aria-label={action.label}
                                title={action.label}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-600"
                              >
                                {action.icon === "key" ? (
                                  <svg
                                    aria-hidden="true"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                  >
                                    <path
                                      d="M14.5 6.5a5 5 0 1 0-1.2 3.25L16 12.5V16h3v3h3v-4.25l-6.7-6.7a5 5 0 0 0-.8-1.55ZM7.5 8.5h.01"
                                      stroke="currentColor"
                                      strokeWidth="1.8"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                ) : action.icon === "undo" ? (
                                  <svg
                                    aria-hidden="true"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                  >
                                    <path
                                      d="M9 14 4 9l5-5M4 9h9a7 7 0 1 1 0 14h-2"
                                      stroke="currentColor"
                                      strokeWidth="1.8"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                ) : (
                                  action.label
                                )}
                              </button>
                            </Popconfirm>
                          ))}
                          {allowDelete && !isRowActionDisabled(record) && <Popconfirm
                            message={`Bạn có chắc muốn xóa bản ghi này?`}
                            onConfirm={() => {
                              deleteMutation.mutate(record.id);
                              setSelectedIds((previous) => {
                                const next = new Set(previous);
                                next.delete(record.id);
                                return next;
                              });
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            <button
                              type="button"
                              aria-label={`Xóa ${title.toLowerCase()}`}
                              disabled={deleteMutation.isPending}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-error-50 hover:text-error-500 disabled:opacity-50"
                            >
                              <TrashBinIcon />
                            </button>
                          </Popconfirm>}
                          {details && (
                            <button
                              type="button"
                              aria-label={`Thông số kỹ thuật của ${title.toLowerCase()}`}
                              title="Thông số kỹ thuật"
                              onClick={() => setDetailsRecord(record)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-500"
                            >
                              <svg
                                aria-hidden="true"
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                              >
                                <path
                                  d="M2 3.5H14M2 8H14M2 12.5H14"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </button>
                          )}
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
              Hiển thị {total === 0 ? 0 : (activePage - 1) * limit + 1}-
              {Math.min(activePage * limit, total)} trong tổng số {total}
              <label htmlFor={`entity-page-size-${endpoint}`} className="ms-2">
                Số dòng:
              </label>
              <select
                id={`entity-page-size-${endpoint}`}
                value={limit}
                onChange={(event) => {
                  setLimit(Number(event.target.value));
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-gray-300 bg-white px-2 dark:border-gray-700 dark:bg-gray-800"
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            {totalPages > 1 && (
              <Pagination
                currentPage={activePage}
                totalPages={totalPages}
                onPageChange={setPage}
                previousLabel="Trước"
                nextLabel="Sau"
              />
            )}
          </div>
        </ComponentCard>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => !saveMutation.isPending && setIsOpen(false)}
        className={`max-h-[calc(100vh-2rem)] overflow-y-auto p-5 sm:p-7 ${
          formColumns === 4
            ? "max-w-6xl"
            : formColumns === 3
              ? "max-w-6xl"
              : formColumns === 2
              ? "max-w-5xl"
              : "max-w-xl"
        }`}
      >
        <form onSubmit={submit} className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {editing ? "Sửa" : "Thêm"} {title.toLowerCase()}
          </h2>
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700"
            >
              {error}
            </div>
          )}
          {lookupsQuery.error && (
            <div
              role="alert"
              className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700"
            >
              {getApiErrorMessage(
                lookupsQuery.error,
                "Không thể tải các danh sách lựa chọn",
              )}
            </div>
          )}
          <div
            className={formGridClass}
          >
            {fields.map((field) =>
              field.tableOnly ? null : (
                <label
                  key={field.name}
                  className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${
                    formColumns === 4 || formColumns === 3
                      ? {
                          1: "md:col-span-1",
                          2: "md:col-span-2",
                          3: "md:col-span-3",
                          4: "md:col-span-4",
                        }[
                          Math.min(
                            field.formSpan ??
                              (field.fullWidth ? formColumns : 1),
                            formColumns,
                          ) as 1 | 2 | 3 | 4
                        ]
                      : formColumns === 2 && field.fullWidth
                        ? "sm:col-span-2"
                        : ""
                  }`}
                >
                  {field.label}
                  {field.readOnly ? (
                    <div className="mt-1.5 flex h-11 items-center rounded-lg border border-gray-200 px-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      {draft[field.name] || "-"}
                    </div>
                  ) : field.lookup?.picker ? (
                    <>
                      <button
                        type="button"
                        disabled={saveMutation.isPending}
                        aria-expanded={
                          field.lookup.picker.inline &&
                          tablePickerField?.name === field.name
                        }
                        onClick={() => {
                          setTablePickerField((current) =>
                            field.lookup!.picker!.inline &&
                            current?.name === field.name
                              ? null
                              : field,
                          );
                          setPickerSearchTerm("");
                          setPickerSearch("");
                          setPickerPage(1);
                        }}
                        className="mt-1.5 flex h-11 w-full items-center justify-between rounded-lg border border-gray-300 bg-transparent px-4 text-left text-sm dark:border-gray-700 dark:bg-gray-900"
                      >
                        <span className="truncate">
                          {selectedPickerQuery.data
                            ? `${String(selectedPickerQuery.data[field.lookup.picker.codeField] ?? "")} — ${String(selectedPickerQuery.data[field.lookup.picker.nameField] ?? "")}`
                            : draft[field.name]
                              ? `Đang tải ${field.label.toLowerCase()}...`
                              : `Chọn ${field.label.toLowerCase()}`}
                        </span>
                        <span aria-hidden="true" className="ms-3 text-gray-500">
                          ▾
                        </span>
                      </button>
                      {field.lookup.picker.inline &&
                        tablePickerField?.name === field.name && (
                          <div className="mt-3">
                            {draft[field.name] && (
                              <div className="mb-3 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateField(field.name, "");
                                    setTablePickerField(null);
                                  }}
                                  className="text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400"
                                >
                                  Bỏ chọn cấp trên
                                </button>
                              </div>
                            )}
                            <EntityLookupPicker
                              title={
                                field.lookup.picker.title ??
                                `Chọn ${field.label.toLowerCase()}`
                              }
                              codeLabel={field.lookup.picker.codeLabel ?? "Mã thiết bị"}
                              nameLabel={field.lookup.picker.nameLabel ?? "Tên thiết bị"}
                              codeField={field.lookup.picker.codeField}
                              nameField={field.lookup.picker.nameField}
                              disabledRecordId={editing?.id}
                              searchTerm={pickerSearchTerm}
                              page={pickerQuery.data?.page ?? pickerPage}
                              limit={pickerQuery.data?.limit ?? pickerLimit}
                              total={pickerQuery.data?.total ?? 0}
                              totalPages={pickerQuery.data?.totalPages ?? 1}
                              records={pickerQuery.data?.data ?? []}
                              isPending={pickerQuery.isPending}
                              error={pickerQuery.error}
                              onSearchChange={(value) => {
                                setPickerSearchTerm(value);
                                setPickerPage(1);
                              }}
                              onPageChange={setPickerPage}
                              onLimitChange={(value) => {
                                setPickerLimit(value);
                                setPickerPage(1);
                              }}
                              onSelect={(record) => {
                                updateField(
                                  field.name,
                                  String(record[field.lookup!.valueField]),
                                );
                                setTablePickerField(null);
                              }}
                            />
                          </div>
                        )}
                    </>
                  ) : field.lookup ? (
                    <select
                      required={field.required}
                      value={draft[field.name] ?? ""}
                      onChange={(event) =>
                        updateField(field.name, event.target.value)
                      }
                      disabled={saveMutation.isPending || lookupsQuery.isPending}
                      className="mt-1.5 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700 dark:bg-gray-900"
                    >
                      <option value="">
                        Chọn {field.label.toLowerCase()}
                      </option>
                      {(lookupsQuery.data?.[field.lookup.endpoint] ?? []).map(
                        (option: EntityRecord) => (
                          <option
                            key={String(option[field.lookup!.valueField])}
                            value={String(option[field.lookup!.valueField])}
                          >
                            {String(option[field.lookup!.labelField] ?? "")}
                          </option>
                        ),
                      )}
                    </select>
                  ) : field.type === "date" ? (
                    <div className="mt-1.5">
                      <DatePicker
                        id={`${formId}-${field.name}`}
                        value={draft[field.name] ?? ""}
                        onValueChange={(value) =>
                          updateField(field.name, value)
                        }
                        disabled={saveMutation.isPending}
                        required={field.required}
                        placeholder="Chọn ngày"
                      />
                    </div>
                  ) : field.type === "textarea" ? (
                    <textarea
                      required={field.required}
                      maxLength={field.maxLength}
                      value={draft[field.name] ?? ""}
                      onChange={(event) =>
                        updateField(field.name, event.target.value)
                      }
                      disabled={saveMutation.isPending}
                      className="mt-1.5 min-h-24 w-full rounded-lg border border-gray-300 bg-transparent p-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                    />
                  ) : field.type === "boolean" ? (
                    <select
                      required={field.required}
                      value={draft[field.name] ?? "false"}
                      onChange={(event) =>
                        updateField(field.name, event.target.value)
                      }
                      disabled={saveMutation.isPending}
                      className="mt-1.5 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700 dark:bg-gray-900"
                    >
                      <option value="false">Không</option>
                      <option value="true">Có</option>
                    </select>
                  ) : (
                    <input
                      type={field.type ?? "text"}
                      required={field.required}
                      maxLength={field.maxLength}
                      value={draft[field.name] ?? ""}
                      onChange={(event) =>
                        updateField(field.name, event.target.value)
                      }
                      disabled={saveMutation.isPending}
                      className="mt-1.5 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700 dark:bg-gray-900"
                    />
                  )}
                  {fieldErrors[field.name] && (
                    <p role="alert" className="mt-1.5 text-xs text-error-500">
                      {fieldErrors[field.name]}
                    </p>
                  )}
                </label>
              ),
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={saveMutation.isPending}
              onClick={() => setIsOpen(false)}
              className="h-11 rounded-lg border border-gray-300 px-4 text-sm disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="h-11 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white disabled:opacity-50"
            >
              {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={copying !== null}
        onClose={() => !copyMutation.isPending && setCopying(null)}
        className="max-w-md p-6"
      >
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Xác nhận sao chép
            </h2>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Bạn có chắc muốn sao chép bản ghi này không?
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={copyMutation.isPending}
              onClick={() => setCopying(null)}
              className="h-10 rounded-lg border border-gray-300 px-4 text-sm disabled:opacity-50 dark:border-gray-700"
            >
              Không
            </button>
            <button
              type="button"
              disabled={copyMutation.isPending || copying === null}
              onClick={() => copying && copyMutation.mutate(copying)}
              className="h-10 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white disabled:opacity-50"
            >
              {copyMutation.isPending ? "Đang sao chép..." : "Có"}
            </button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={
          tablePickerField !== null &&
          !tablePickerField.lookup?.picker?.inline
        }
        onClose={() => setTablePickerField(null)}
        className="max-h-[calc(100vh-2rem)] max-w-4xl overflow-y-auto p-5 sm:p-7"
      >
        {tablePickerField?.lookup?.picker && (
          <EntityLookupPicker
            title={
              tablePickerField.lookup.picker.title ??
              `Chọn ${tablePickerField.label.toLowerCase()}`
            }
            codeLabel={
              tablePickerField.lookup.picker.codeLabel ?? "Mã thiết bị"
            }
            nameLabel={
              tablePickerField.lookup.picker.nameLabel ?? "Tên thiết bị"
            }
            codeField={tablePickerField.lookup.picker.codeField}
            nameField={tablePickerField.lookup.picker.nameField}
            disabledRecordId={editing?.id}
            searchTerm={pickerSearchTerm}
            page={pickerQuery.data?.page ?? pickerPage}
            limit={pickerQuery.data?.limit ?? pickerLimit}
            total={pickerQuery.data?.total ?? 0}
            totalPages={pickerQuery.data?.totalPages ?? 1}
            records={pickerQuery.data?.data ?? []}
            isPending={pickerQuery.isPending}
            error={pickerQuery.error}
            onSearchChange={(value) => {
              setPickerSearchTerm(value);
              setPickerPage(1);
            }}
            onPageChange={setPickerPage}
            onLimitChange={(value) => {
              setPickerLimit(value);
              setPickerPage(1);
            }}
            onSelect={(record) => {
              updateField(
                tablePickerField.name,
                String(record[tablePickerField.lookup!.valueField]),
              );
              setTablePickerField(null);
            }}
          />
        )}
      </Modal>
      {details && detailsRecord && (
        <Modal
          isOpen
          onClose={() => setDetailsRecord(null)}
          className="max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] overflow-y-auto p-4 sm:p-6"
        >
          <div className="mb-4 flex items-center justify-between gap-4 pe-10">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Chi tiết thiết bị — {String(detailsRecord.ten_thiet_bi ?? detailsRecord.name ?? detailsRecord.id)}
            </h2>
          </div>
          <EntityManager
            key={detailsRecord.id}
            endpoint={details.endpoint.replace(
              "{id}",
              String(detailsRecord.id),
            )}
            title={details.title}
            fields={details.fields}
            tableFields={details.tableFields}
            tree={details.tree}
            allowCopy
            allowBulkDelete={details.allowBulkDelete}
            allowExport={details.allowExport}
            copyExcludedFields={details.copyExcludedFields}
            disableEditDeleteWhen={details.disableEditDeleteWhen}
            embedded
          />
        </Modal>
      )}
    </>
  );
}
