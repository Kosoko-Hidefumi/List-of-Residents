import { useMemo } from "react";
import { ResidentRecord, SortMode } from "../types";

interface FilterOptions {
  searchText: string;
  selectedYear: string;
  selectedGrade: string;
  selectedGender: string;
  selectedDept: string;
  sortMode: SortMode;
}

export function useDataFilter(data: ResidentRecord[], options: FilterOptions) {
  const {
    searchText,
    selectedYear,
    selectedGrade,
    selectedGender,
    selectedDept,
    sortMode,
  } = options;

  const filteredData = useMemo(() => {
    let result = [...data];

    if (selectedYear && selectedYear !== "all") {
      result = result.filter((r) => r.年度 === selectedYear);
    }

    if (selectedGrade && selectedGrade !== "all") {
      result = result.filter((r) => r.学年 === selectedGrade);
    }

    if (selectedGender && selectedGender !== "all") {
      result = result.filter((r) => r.性別 === selectedGender);
    }

    if (selectedDept && selectedDept !== "all") {
      result = result.filter((r) => r.専門科 === selectedDept);
    }

    if (searchText) {
      const lower = searchText.toLowerCase();
      result = result.filter(
        (r) =>
          r.名前.toLowerCase().includes(lower) ||
          r.ふりがな.toLowerCase().includes(lower) ||
          r.出身大学.toLowerCase().includes(lower) ||
          r.専門科.toLowerCase().includes(lower) ||
          r.本籍.toLowerCase().includes(lower)
      );
    }

    return result;
  }, [data, searchText, selectedYear, selectedGrade, selectedGender, selectedDept]);

  const sortedByGrade = useMemo(() => {
    const gradeOrder = ["PGY1", "PGY2", "PGY3", "PGY4", "PGY5", "PGY6"];
    const grouped: Record<string, ResidentRecord[]> = {};

    gradeOrder.forEach((grade) => {
      grouped[grade] = [];
    });

    filteredData.forEach((r) => {
      if (grouped[r.学年]) {
        grouped[r.学年].push(r);
      } else {
        if (!grouped["その他"]) grouped["その他"] = [];
        grouped["その他"].push(r);
      }
    });

    if (sortMode === "kana") {
      Object.keys(grouped).forEach((grade) => {
        grouped[grade].sort((a, b) => {
          const aKey = a.ふりがな || a.名前;
          const bKey = b.ふりがな || b.名前;
          return aKey.localeCompare(bKey, "ja");
        });
      });
    } else if (sortMode === "dept") {
      Object.keys(grouped).forEach((grade) => {
        grouped[grade].sort((a, b) => {
          const deptCompare = (a.専門科正規化 || "").localeCompare(
            b.専門科正規化 || "",
            "ja"
          );
          if (deptCompare !== 0) return deptCompare;
          const aKey = a.ふりがな || a.名前;
          const bKey = b.ふりがな || b.名前;
          return aKey.localeCompare(bKey, "ja");
        });
      });
    }

    return grouped;
  }, [filteredData, sortMode]);

  const years = useMemo(() => {
    const yearSet = new Set<string>();
    data.forEach((r) => {
      if (r.年度) yearSet.add(r.年度);
    });
    return Array.from(yearSet).sort();
  }, [data]);

  const grades = useMemo(() => {
    const gradeSet = new Set<string>();
    data.forEach((r) => {
      if (r.学年) gradeSet.add(r.学年);
    });
    const gradeOrder = ["PGY1", "PGY2", "PGY3", "PGY4", "PGY5", "PGY6"];
    return gradeOrder.filter((g) => gradeSet.has(g));
  }, [data]);

  const depts = useMemo(() => {
    const deptSet = new Set<string>();
    data.forEach((r) => {
      if (r.専門科) deptSet.add(r.専門科);
    });
    return Array.from(deptSet).sort((a, b) => a.localeCompare(b, "ja"));
  }, [data]);

  return {
    filteredData,
    sortedByGrade,
    years,
    grades,
    depts,
    totalCount: filteredData.length,
  };
}
