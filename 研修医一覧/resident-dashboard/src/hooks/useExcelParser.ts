import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { ResidentRecord } from "../types";
import { normalizeDept } from "../utils/normalizeDept";
import {
  loadResidentCache,
  saveResidentCache,
  clearResidentCache,
} from "../utils/residentCache";

export function useExcelParser() {
  const [data, setData] = useState<ResidentRecord[]>(
    () => loadResidentCache()?.data ?? []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState(
    () => loadResidentCache()?.fileName ?? ""
  );

  const parseFile = useCallback((file: File) => {
    setIsLoading(true);
    setError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const wb = XLSX.read(buffer, { type: "array" });
        const sheetName = wb.SheetNames.includes("main")
          ? "main"
          : wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
          defval: "",
        });
        const parsed: ResidentRecord[] = rows
          .filter((r) => r["名前"])
          .map((r) => ({
            年度:   String(r["年度"]   ?? ""),
            学年:   String(r["学年"]   ?? ""),
            "初・後": String(r["初・後"] ?? ""),
            PHS:    String(r["PHS"]    ?? ""),
            名前:   String(r["名前"]   ?? ""),
            ふりがな: String(r["ふりがな"] ?? ""),
            性別:   String(r["性別"]   ?? ""),
            専門科: String(r["専門科"] ?? ""),
            進路:   String(r["進路"]   ?? ""),
            動向調査: String(r["動向調査"] ?? ""),
            本籍:   String(r["本籍"]   ?? ""),
            出身大学: String(r["出身大学"] ?? ""),
            備考:   String(r["備考"]   ?? ""),
            email:  String(r["email"]  ?? ""),
            専門科正規化: normalizeDept(String(r["専門科"] ?? "")),
          }));
        setData(parsed);
        saveResidentCache(file.name, parsed);
      } catch {
        setError("Excelファイルの読み込みに失敗しました。形式を確認してください。");
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const resetData = useCallback(() => {
    clearResidentCache();
    setData([]);
    setFileName("");
    setError(null);
  }, []);

  return { data, isLoading, error, fileName, parseFile, resetData };
}
