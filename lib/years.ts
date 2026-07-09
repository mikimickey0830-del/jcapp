import { members } from "@/lib/members";
import type { FiscalYear, FiscalYearStatus } from "@/types/year";

export const fiscalYearStatusLabels: Record<FiscalYearStatus, string> = {
  current: "現在年度",
  planned: "準備中",
  closed: "終了"
};

export const fiscalYears: FiscalYear[] = [
  {
    id: "10000000-0000-0000-0000-000000002027",
    year: 2027,
    name: "2027年度",
    lomName: "玉島青年会議所",
    startsOn: "2027-01-01",
    endsOn: "2027-12-31",
    status: "planned",
    copiedFromYear: 2026,
    committees: [
      { id: "c2027-01", name: "総務広報委員会", sortOrder: 1 },
      { id: "c2027-02", name: "例会委員会", sortOrder: 2 },
      { id: "c2027-03", name: "地域事業委員会", sortOrder: 3 }
    ],
    positions: [
      { id: "p2027-01", name: "理事長", sortOrder: 1 },
      { id: "p2027-02", name: "専務理事", sortOrder: 2 },
      { id: "p2027-03", name: "委員長", sortOrder: 3 },
      { id: "p2027-04", name: "副委員長", sortOrder: 4 },
      { id: "p2027-05", name: "委員", sortOrder: 5 }
    ],
    assignments: [
      {
        memberId: "m001",
        committeeId: "c2027-01",
        positionId: "p2027-03",
        role: "chair",
        isBoardMember: true
      },
      {
        memberId: "m002",
        committeeId: "c2027-02",
        positionId: "p2027-04",
        role: "vice_chair",
        isBoardMember: false
      }
    ]
  },
  {
    id: "10000000-0000-0000-0000-000000002026",
    year: 2026,
    name: "2026年度",
    lomName: "玉島青年会議所",
    startsOn: "2026-01-01",
    endsOn: "2026-12-31",
    status: "current",
    copiedFromYear: 2025,
    committees: [
      { id: "30000000-0000-0000-0000-000000000001", name: "総務広報委員会", sortOrder: 1 },
      { id: "30000000-0000-0000-0000-000000000002", name: "例会委員会", sortOrder: 2 },
      { id: "30000000-0000-0000-0000-000000000003", name: "地域事業委員会", sortOrder: 3 },
      { id: "30000000-0000-0000-0000-000000000004", name: "監事", sortOrder: 4 }
    ],
    positions: [
      { id: "40000000-0000-0000-0000-000000000001", name: "理事長", sortOrder: 1 },
      { id: "40000000-0000-0000-0000-000000000002", name: "専務理事", sortOrder: 2 },
      { id: "40000000-0000-0000-0000-000000000003", name: "委員長", sortOrder: 3 },
      { id: "40000000-0000-0000-0000-000000000004", name: "副委員長", sortOrder: 4 },
      { id: "40000000-0000-0000-0000-000000000005", name: "委員", sortOrder: 5 }
    ],
    assignments: [
      {
        memberId: "m001",
        committeeId: "30000000-0000-0000-0000-000000000001",
        positionId: "40000000-0000-0000-0000-000000000003",
        role: "chair",
        isBoardMember: true
      },
      {
        memberId: "m002",
        committeeId: "30000000-0000-0000-0000-000000000002",
        positionId: "40000000-0000-0000-0000-000000000004",
        role: "vice_chair",
        isBoardMember: false
      },
      {
        memberId: "m003",
        committeeId: "30000000-0000-0000-0000-000000000004",
        positionId: "40000000-0000-0000-0000-000000000002",
        role: "admin",
        isBoardMember: true
      },
      {
        memberId: "m004",
        committeeId: "30000000-0000-0000-0000-000000000003",
        positionId: "40000000-0000-0000-0000-000000000005",
        role: "member",
        isBoardMember: false
      }
    ]
  },
  {
    id: "10000000-0000-0000-0000-000000002025",
    year: 2025,
    name: "2025年度",
    lomName: "玉島青年会議所",
    startsOn: "2025-01-01",
    endsOn: "2025-12-31",
    status: "closed",
    committees: [
      { id: "c2025-01", name: "会員交流委員会", sortOrder: 1 },
      { id: "c2025-02", name: "地域未来委員会", sortOrder: 2 }
    ],
    positions: [
      { id: "p2025-01", name: "理事長", sortOrder: 1 },
      { id: "p2025-02", name: "委員長", sortOrder: 2 },
      { id: "p2025-03", name: "副委員長", sortOrder: 3 },
      { id: "p2025-04", name: "委員", sortOrder: 4 }
    ],
    assignments: [
      {
        memberId: "m001",
        committeeId: "c2025-01",
        positionId: "p2025-03",
        role: "member",
        isBoardMember: false
      }
    ]
  }
];

export function getFiscalYear(yearOrId: string | number) {
  const value = String(yearOrId);
  return fiscalYears.find((fiscalYear) => fiscalYear.id === value || fiscalYear.year === Number(value));
}

export function getCommittee(fiscalYear: FiscalYear, committeeId: string) {
  return fiscalYear.committees.find((committee) => committee.id === committeeId);
}

export function getPosition(fiscalYear: FiscalYear, positionId: string) {
  return fiscalYear.positions.find((position) => position.id === positionId);
}

export function getAssignmentRows(fiscalYear: FiscalYear) {
  return fiscalYear.assignments.map((assignment) => {
    const member = members.find((item) => item.id === assignment.memberId);

    return {
      ...assignment,
      memberName: assignment.memberName ?? (member ? `${member.lastName} ${member.firstName}` : "未登録会員"),
      memberKana: assignment.memberKana ?? (member ? `${member.lastNameKana} ${member.firstNameKana}` : ""),
      committeeName: assignment.committeeName ?? getCommittee(fiscalYear, assignment.committeeId)?.name ?? "未設定",
      positionName: assignment.positionName ?? getPosition(fiscalYear, assignment.positionId)?.name ?? "未設定"
    };
  });
}
