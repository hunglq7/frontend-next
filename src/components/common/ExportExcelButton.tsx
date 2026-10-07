"use client";

import Button from "@/components/ui/button/Button";
import { DownloadIcon } from "@/icons";
import { strToU8, zipSync } from "fflate";
import { useState } from "react";
import { toast } from "sonner";

export type ExcelColumn<T> = {
  header: string;
  value: (row: T) => string | number | null;
};

type ExportExcelButtonProps<T> = {
  data: T[];
  columns: ExcelColumn<T>[];
  fileName: string;
  sheetName: string;
  loadData?: () => Promise<T[]>;
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\uFFFE\uFFFF]/g, "");
}

function getColumnName(index: number) {
  let name = "";
  let columnIndex = index + 1;

  while (columnIndex > 0) {
    const remainder = (columnIndex - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    columnIndex = Math.floor((columnIndex - 1) / 26);
  }

  return name;
}

function getColumnWidths<T>(
  rows: (string | number | null)[][],
  columns: ExcelColumn<T>[],
) {
  return columns.map((_, columnIndex) => {
    const longestLine = rows.reduce((longest, row) => {
      const value = row[columnIndex];
      const lines = (value === null ? "" : String(value)).split(/\r\n|\r|\n/);
      return lines.reduce(
        (lineLongest, line) =>
          Math.max(lineLongest, Array.from(line).length),
        longest,
      );
    }, 0);

    return Math.min(255, Math.max(10, longestLine + 2));
  });
}

function createCell(reference: string, value: string | number | null) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${reference}"><v>${value}</v></c>`;
  }

  const text = value === null ? "" : String(value);
  return `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(text)}</t></is></c>`;
}

function createWorkbook<T>(
  data: T[],
  columns: ExcelColumn<T>[],
  sheetName: string,
) {
  const rows = [
    columns.map((column) => column.header),
    ...data.map((row) => columns.map((column) => column.value(row))),
  ];
  const columnWidths = getColumnWidths(rows, columns);

  const sheetRows = rows
    .map(
      (row, rowIndex) =>
        `<row r="${rowIndex + 1}">${row
          .map((value, columnIndex) =>
            createCell(`${getColumnName(columnIndex)}${rowIndex + 1}`, value),
          )
          .join("")}</row>`,
    )
    .join("");

  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        "</Types>",
    ),
    "_rels/.rels": strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        "</Relationships>",
    ),
    "xl/workbook.xml": strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        `<sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets>` +
        "</workbook>",
    ),
    "xl/_rels/workbook.xml.rels": strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
        "</Relationships>",
    ),
    "xl/worksheets/sheet1.xml": strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        `<cols>${columnWidths
          .map(
            (width, index) =>
              `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`,
          )
          .join("")}</cols>` +
        `<sheetData>${sheetRows}</sheetData>` +
        "</worksheet>",
    ),
  };

  return zipSync(files);
}

export default function ExportExcelButton<T>({
  data,
  columns,
  fileName,
  sheetName,
  loadData,
}: ExportExcelButtonProps<T>) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportData = loadData ? await loadData() : data;
      const workbook = createWorkbook(exportData, columns, sheetName);
      const blob = new Blob([workbook.buffer as ArrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      toast.error("Không thể tải dữ liệu để xuất Excel");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => void handleExport()}
      disabled={isExporting || data.length === 0}
      startIcon={<DownloadIcon />}
      className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 bg-transparent border border-gray-300 rounded-lg transition-all duration-300 ease-in-out hover:border-cyan-400 hover:text-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20 active:scale-95 "
    >
      {isExporting ? "Đang xuất..." : "Xuất Excel"}
    </Button>
 
  );
}
