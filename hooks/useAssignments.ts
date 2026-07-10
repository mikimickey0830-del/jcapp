import { getFallbackAssignmentSummaries, getFallbackAssignmentYear } from "@/lib/assignments";

export function useAssignments() {
  return {
    assignments: getFallbackAssignmentSummaries()
  };
}

export function useAssignmentYear(yearId: string) {
  return {
    assignmentYear: getFallbackAssignmentYear(yearId)
  };
}
