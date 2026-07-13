import type { AnnualRole } from "@/types/common";
import type { CommitteeMemberRole } from "@/types/committee";

export type MemberStatus = "active" | "inactive" | "graduated";

export type InvitationStatus = "not_invited" | "invited" | "active" | "failed";

export type AnnualMemberProfile = {
  fiscalYear: number;
  committee: string;
  committeeMemberships?: Array<{
    committeeName: string;
    roleInCommittee: CommitteeMemberRole;
    isPrimary: boolean;
    note: string;
  }>;
  position: string;
  role: AnnualRole;
};

export type Member = {
  id: string;
  authUserId?: string;
  lomId?: string;
  invitationStatus?: InvitationStatus;
  invitedAt?: string;
  activatedAt?: string;
  invitationLastSentAt?: string;
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  email: string;
  phone: string;
  lomName: string;
  joinedYear: number;
  status: MemberStatus;
  annualProfiles: AnnualMemberProfile[];
};
