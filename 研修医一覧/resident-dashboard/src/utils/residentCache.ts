import type { ResidentRecord } from "../types";

const STORAGE_KEY = "resident-dashboard:excel-cache:v1";

type StoredPayload = {
  v: 1;
  fileName: string;
  data: ResidentRecord[];
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function looksLikeResidentRow(x: unknown): x is ResidentRecord {
  if (!isRecord(x)) return false;
  return typeof x["名前"] === "string";
}

export function loadResidentCache(): StoredPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    if (parsed.v !== 1) return null;
    if (typeof parsed.fileName !== "string") return null;
    if (!Array.isArray(parsed.data)) return null;
    if (parsed.data.length === 0) return null;
    if (!parsed.data.every(looksLikeResidentRow)) return null;
    return {
      v: 1,
      fileName: parsed.fileName,
      data: parsed.data as ResidentRecord[],
    };
  } catch {
    return null;
  }
}

export function saveResidentCache(fileName: string, data: ResidentRecord[]): void {
  if (typeof window === "undefined" || data.length === 0) return;
  try {
    const payload: StoredPayload = { v: 1, fileName, data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // 容量超過などは黙ってスキップ（画面はそのセッションでは動く）
  }
}

export function clearResidentCache(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
