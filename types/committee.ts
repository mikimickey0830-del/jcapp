import type { Member } from "@/types/member";

export type CommitteeMemberRole = "vice_president" | "chair" | "vice_chair" | "member";

export type CommitteeMember = Pick<
  Member,
  "id" | "lastName" | "firstName" | "lastNameKana" | "firstNameKana" | "email"
> & {
  role: CommitteeMemberRole;
};

export type CommitteeDetail = {
  id: string;
  fiscalYearId: string;
  fiscalYearName: string;
  fiscalYear: number;
  lomName: string;
  name: string;
  description: string;
  vicePresidentMemberId: string;
  chairMemberId: string;
  viceChairMemberId: string;
  memberIds: string[];
  members: CommitteeMember[];
  sortOrder: number;
  deletedAt: string | null;
};

export type CommitteeFormOptions = {
  fiscalYears: Array<{
    id: string;
    name: string;
    year: number;
    lomName: string;
  }>;
  members: Member[];
};

export type CommitteeMutationPayload = {
  fiscalYearId?: string;
  name?: string;
  description?: string;
  vicePresidentMemberId?: string;
  chairMemberId?: string;
  viceChairMemberId?: string;
  memberIds?: string[];
};
