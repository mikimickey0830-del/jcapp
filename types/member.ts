import type { AnnualRole } from "@/types/common";

export type MemberStatus = "active" | "inactive" | "graduated";

export type AnnualMemberProfile = {
  fiscalYear: number;
  committee: string;
  position: string;
  role: AnnualRole;
};

export type Member = {
  id: string;
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
