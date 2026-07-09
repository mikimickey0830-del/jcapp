import { members } from "@/lib/members";
import { fiscalYears } from "@/lib/years";
import type { CommitteeDetail } from "@/types/committee";
import type { Committee } from "@/types/year";

function memberById(memberId: string) {
  return members.find((member) => member.id === memberId);
}

function toCommitteeDetail(committee: Committee, fiscalYearId: string): CommitteeDetail {
  const fiscalYear = fiscalYears.find((year) => year.id === fiscalYearId) ?? fiscalYears[0];
  const assignments = fiscalYear.assignments.filter((assignment) => assignment.committeeId === committee.id);
  const memberIds = assignments.map((assignment) => assignment.memberId);
  const chairMemberId = assignments.find((assignment) => assignment.role === "chair")?.memberId ?? "";
  const viceChairMemberId = assignments.find((assignment) => assignment.role === "vice_chair")?.memberId ?? "";
  const vicePresidentMemberId = assignments.find((assignment) => assignment.role === "president")?.memberId ?? "";

  return {
    id: committee.id,
    fiscalYearId: fiscalYear.id,
    fiscalYearName: fiscalYear.name,
    fiscalYear: fiscalYear.year,
    lomName: fiscalYear.lomName,
    name: committee.name,
    description: "年度ごとに活動内容を管理する委員会です。",
    vicePresidentMemberId,
    chairMemberId,
    viceChairMemberId,
    memberIds,
    members: assignments
      .map((assignment) => {
        const member = memberById(assignment.memberId);

        if (!member) {
          return null;
        }

        return {
          id: member.id,
          lastName: member.lastName,
          firstName: member.firstName,
          lastNameKana: member.lastNameKana,
          firstNameKana: member.firstNameKana,
          email: member.email,
          role:
            assignment.memberId === vicePresidentMemberId
              ? "vice_president"
              : assignment.memberId === chairMemberId
                ? "chair"
                : assignment.memberId === viceChairMemberId
                  ? "vice_chair"
                  : "member"
        } as const;
      })
      .filter((member): member is CommitteeDetail["members"][number] => Boolean(member)),
    sortOrder: committee.sortOrder,
    deletedAt: null
  };
}

export const committees = fiscalYears.flatMap((fiscalYear) =>
  fiscalYear.committees.map((committee) => toCommitteeDetail(committee, fiscalYear.id))
);

export function getCommittee(committeeId: string) {
  return committees.find((committee) => committee.id === committeeId);
}
