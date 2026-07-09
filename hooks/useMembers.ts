import { memberService } from "@/services/memberService";

export function useMembers() {
  return {
    members: memberService.getFallbackMembers(),
    getCurrentAnnualProfile: memberService.getCurrentAnnualProfile,
    roleLabels: memberService.roleLabels,
    statusLabels: memberService.statusLabels
  };
}

export function useMember(memberId: string) {
  return {
    member: memberService.getFallbackMemberById(memberId),
    roleLabels: memberService.roleLabels,
    statusLabels: memberService.statusLabels
  };
}
