import { yearService } from "@/services/yearService";

export function useYears() {
  return {
    fiscalYears: yearService.getYears(),
    fiscalYearStatusLabels: yearService.fiscalYearStatusLabels
  };
}

export function useYear(year: string | number) {
  return {
    fiscalYear: yearService.getYearByValue(year),
    getAssignmentRows: yearService.getAssignmentRows,
    fiscalYearStatusLabels: yearService.fiscalYearStatusLabels
  };
}
