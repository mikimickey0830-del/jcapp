import type { AnnualRole } from "@/types/common";
import type { Member } from "@/types/member";
import type { CommitteeMemberRole } from "@/types/committee";

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
  committeeMemberships: AssignmentCommitteeMembership[];
  positionId: string;
  positionName: string;
  role: AnnualRole;
  isBoardMember: boolean;
  isActive: boolean;
};

export type AssignmentCommitteeMembership = {
  id: string;
  committeeId: string;
  committeeName: string;
  roleInCommittee: CommitteeMemberRole;
  isPrimary: boolean;
  note: string;
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
  positionId?: string;
  role?: AnnualRole;
  isBoardMember?: boolean;
  isActive?: boolean;
  committeeMemberships?: Array<{
    id?: string;
    committeeId?: string;
    roleInCommittee?: CommitteeMemberRole;
    isPrimary?: boolean;
    note?: string;
    deleted?: boolean;
  }>;
};
