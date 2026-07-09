import type { LegacyAnnualRole } from "@/types/common";

export type FiscalYearStatus = "current" | "planned" | "closed";

export type Committee = {
  id: string;
  name: string;
  sortOrder: number;
};

export type Position = {
  id: string;
  name: string;
  sortOrder: number;
};

export type AnnualAssignment = {
  memberId: string;
  committeeId: string;
  positionId: string;
  role: LegacyAnnualRole;
  isBoardMember: boolean;
};

export type FiscalYear = {
  year: number;
  name: string;
  lomName: string;
  startsOn: string;
  endsOn: string;
  status: FiscalYearStatus;
  copiedFromYear?: number;
  committees: Committee[];
  positions: Position[];
  assignments: AnnualAssignment[];
};
