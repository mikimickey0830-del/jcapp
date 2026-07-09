export type AppRole = "member" | "vice_chair" | "chair" | "secretary" | "president" | "admin";

export type LegacyAnnualRole = "owner" | "admin" | "committee_manager" | "member";

export type AnnualRole = AppRole | LegacyAnnualRole;

export type Lom = {
  id: string;
  name: string;
  slug: string;
  prefecture?: string;
  city?: string;
};

// TODO: LOM管理機能を追加するときは、ユーザーの所属LOM、複数LOM切り替え、
// LOM単位の権限境界をこの型から拡張する。
export type LomScopedEntity = {
  lomName: string;
};

export type StatusTone = "blue" | "green" | "amber" | "red";
