import { committeeService } from "@/services/committeeService";

export function useCommittees() {
  return {
    committees: committeeService.getFallbackCommittees()
  };
}

export function useCommittee(committeeId: string) {
  return {
    committee: committeeService.getFallbackCommitteeById(committeeId)
  };
}
