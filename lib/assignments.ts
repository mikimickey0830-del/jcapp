import { members } from "@/lib/members";
import { fiscalYears } from "@/lib/years";
import type {
  AnnualMemberAssignmentView,
  AssignmentFormOptions,
  AssignmentYearDetail,
  AssignmentYearSummary
} from "@/types/assignment";

export const assignmentRoleLabels = {
  member: "会員",
  vice_chair: "副委員長",
  chair: "委員長",
  secretary: "専務理事",
  president: "理事長",
  admin: "管理者",
  owner: "管理者",
  committee_manager: "委員長"
} as const;

export const committeeRoleLabels = {
  vice_president: "担当副理事長",
  chair: "委員長",
  vice_chair: "副委員長",
  member: "委員",
  observer: "オブザーバー",
  advisor: "アドバイザー"
} as const;

export function getFallbackAssignmentSummaries(): AssignmentYearSummary[] {
  return fiscalYears.map((year) => ({
    fiscalYearId: year.id,
    fiscalYearName: year.name,
    fiscalYear: year.year,
    lomName: year.lomName,
    memberCount: members.length,
    assignmentCount: year.assignments.length,
    activeCount: year.assignments.length,
    inactiveCount: 0
  }));
}

export function getFallbackAssignmentYear(yearId: string): AssignmentYearDetail | undefined {
  const fiscalYear = fiscalYears.find((year) => year.id === yearId || year.year === Number(yearId));

  if (!fiscalYear) {
    return undefined;
  }

  return {
    fiscalYearId: fiscalYear.id,
    fiscalYearName: fiscalYear.name,
    fiscalYear: fiscalYear.year,
    lomName: fiscalYear.lomName,
    rows: members.map<AnnualMemberAssignmentView>((member) => {
      const assignment = fiscalYear.assignments.find((item) => item.memberId === member.id);
      const committee = fiscalYear.committees.find((item) => item.id === assignment?.committeeId);
      const position = fiscalYear.positions.find((item) => item.id === assignment?.positionId);
      const committeeMemberships = assignment?.committeeId
        ? [
            {
              id: `${fiscalYear.id}-${member.id}-${assignment.committeeId}`,
              committeeId: assignment.committeeId,
              committeeName: committee?.name ?? "未設定",
              roleInCommittee:
                assignment.role === "chair" || assignment.role === "committee_manager"
                  ? "chair"
                  : assignment.role === "vice_chair"
                    ? "vice_chair"
                    : "member",
              isPrimary: true,
              note: ""
            } as const
          ]
        : [];

      return {
        id: assignment ? `${fiscalYear.id}-${member.id}` : "",
        fiscalYearId: fiscalYear.id,
        fiscalYearName: fiscalYear.name,
        fiscalYear: fiscalYear.year,
        memberId: member.id,
        memberName: `${member.lastName} ${member.firstName}`,
        memberKana: `${member.lastNameKana} ${member.firstNameKana}`,
        memberEmail: member.email,
        committeeId: assignment?.committeeId ?? "",
        committeeName: committee?.name ?? "未設定",
        committeeMemberships,
        positionId: assignment?.positionId ?? "",
        positionName: position?.name ?? "未設定",
        role: assignment?.role ?? "member",
        isBoardMember: assignment?.isBoardMember ?? false,
        isActive: Boolean(assignment)
      };
    })
  };
}

export function getFallbackAssignmentFormOptions(
  yearId: string,
  memberId: string
): AssignmentFormOptions | undefined {
  const fiscalYear = fiscalYears.find((year) => year.id === yearId || year.year === Number(yearId));
  const member = members.find((item) => item.id === memberId);

  if (!fiscalYear || !member) {
    return undefined;
  }

  return {
    fiscalYear: {
      id: fiscalYear.id,
      name: fiscalYear.name,
      year: fiscalYear.year,
      lomName: fiscalYear.lomName
    },
    member,
    committees: fiscalYear.committees.map((committee) => ({
      id: committee.id,
      name: committee.name
    })),
    positions: fiscalYear.positions.map((position) => ({
      id: position.id,
      name: position.name
    }))
  };
}
