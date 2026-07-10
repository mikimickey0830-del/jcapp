import type { AnnualRole } from "@/types/common";
import type { Member } from "@/types/member";

export type AssignmentStatus = "active" | "inactive";

export type AssignmentYearSummary = {
  fiscalYearId: string;
  fiscalYearName: string;
  fiscalYear: number;
  lomName: string;
  memberCount: number;
  assignmentCount: number;
  activeCount: number;
  inactiveCount: number;
};

export type AnnualMemberAssignmentView = {
  id: string;
  fiscalYearId: string;
  fiscalYearName: string;
  fiscalYear: number;
  memberId: string;
  memberName: string;
  memberKana: string;
  memberEmail: string;
  committeeId: string;
  committeeName: string;
  positionId: string;
  positionName: string;
  role: AnnualRole;
  isBoardMember: boolean;
  isActive: boolean;
};

export type AssignmentYearDetail = {
  fiscalYearId: string;
  fiscalYearName: string;
  fiscalYear: number;
  lomName: string;
  rows: AnnualMemberAssignmentView[];
};

export type AssignmentFormOptions = {
  fiscalYear: {
    id: string;
    name: string;
    year: number;
    lomName: string;
  };
  member: Member;
  committees: Array<{
    id: string;
    name: string;
  }>;
  positions: Array<{
    id: string;
    name: string;
  }>;
};

export type AssignmentMutationPayload = {
  committeeId?: string;
  positionId?: string;
  role?: AnnualRole;
  isBoardMember?: boolean;
  isActive?: boolean;
};
