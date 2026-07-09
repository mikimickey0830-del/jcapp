import {
  fiscalYears,
  fiscalYearStatusLabels,
  getAssignmentRows,
  getFiscalYear
} from "@/lib/years";

// TODO: Supabase接続時にここを差し替える。
export const yearService = {
  getYears: () => fiscalYears,
  getYearByValue: (year: string | number) => getFiscalYear(year),
  getAssignmentRows,
  fiscalYearStatusLabels
};
