import { yearService } from "@/services/yearService";

export function useYears() {
  return {
    fiscalYears: yearService.getFallbackYears(),
    fiscalYearStatusLabels: yearService.fiscalYearStatusLabels
  };
}

export function useYear(year: string | number) {
  return {
    fiscalYear: yearService.getFallbackYearByValue(year),
    getAssignmentRows: yearService.getAssignmentRows,
    fiscalYearStatusLabels: yearService.fiscalYearStatusLabels
  };
}
