import {
  announcementImportanceLabels,
  announcementImportanceTones,
  announcements,
  announcementTypeLabels,
  announcementTypeTones,
  announcementVisibilityLabels,
  getAnnouncement,
  getAnnouncementAuthor
} from "@/lib/announcements";
import { committees as fallbackCommittees } from "@/lib/committees";
import { members as fallbackMembers } from "@/lib/members";
import { fiscalYears as fallbackFiscalYears } from "@/lib/years";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/service";
import type { Announcement, AnnouncementFormOptions } from "@/types/announcement";

type Source = "supabase" | "fallback";

export type AnnouncementQueryResult<T> = {
  data: T;
  error: string | null;
  source: Source;
};

type SupabaseRelation<T> = T | T[] | null;

type AnnouncementRow = {
  id: string;
  lom_id: string;
  fiscal_year_id: string;
  title: string;
  body: string;
  announcement_type: Announcement["type"];
  target_lom: string;
  target_committee_id: string | null;
  visibility: Announcement["visibility"];
  importance: Announcement["importance"];
  publish_start_at: string;
  publish_end_at: string | null;
  author_member_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  fiscal_years: SupabaseRelation<{
    id: string;
    year: number;
    name: string;
    loms: SupabaseRelation<{ id: string; name: string | null }>;
  }>;
  committees: SupabaseRelation<{ id: string; name: string }>;
  members: SupabaseRelation<{ id: string; last_name: string; first_name: string }>;
};

type FiscalYearRow = {
  id: string;
  lom_id: string;
  year: number;
  name: string;
  loms: SupabaseRelation<{ id: string; name: string | null }>;
};

type CommitteeRow = {
  id: string;
  fiscal_year_id: string;
  name: string;
};

type MemberRow = {
  id: string;
  last_name: string;
  first_name: string;
};

type LomRow = {
  id: string;
  name: string;
};

const announcementSelect = `
  id,
  lom_id,
  fiscal_year_id,
  title,
  body,
  announcement_type,
  target_lom,
  target_committee_id,
  visibility,
  importance,
  publish_start_at,
  publish_end_at,
  author_member_id,
  created_at,
  updated_at,
  deleted_at,
  fiscal_years(id, year, name, loms(id, name)),
  committees(id, name),
  members(id, last_name, first_name)
`;

function firstRelation<T>(relation: SupabaseRelation<T>) {
  return Array.isArray(relation) ? relation[0] : relation;
}

function toAnnouncement(row: AnnouncementRow): Announcement {
  const fiscalYear = firstRelation(row.fiscal_years);
  const lom = firstRelation(fiscalYear?.loms ?? null);
  const committee = firstRelation(row.committees);
  const author = firstRelation(row.members);

  return {
    id: row.id,
    lomId: row.lom_id,
    fiscalYearId: row.fiscal_year_id,
    fiscalYear: fiscalYear?.year ?? 0,
    fiscalYearName: fiscalYear?.name ?? "未設定年度",
    title: row.title,
    body: row.body,
    type: row.announcement_type,
    targetLom: row.target_lom || lom?.name || "未設定LOM",
    targetCommitteeId: row.target_committee_id ?? undefined,
    targetCommittee: committee?.name,
    visibility: row.visibility,
    importance: row.importance,
    publishStartAt: row.publish_start_at,
    publishEndAt: row.publish_end_at ?? undefined,
    authorMemberId: row.author_member_id ?? undefined,
    authorMemberName: author ? `${author.last_name} ${author.first_name}` : "未設定",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
    notificationType: "announcement"
  };
}

function fallbackFormOptions(): AnnouncementFormOptions {
  const defaultLomId = "00000000-0000-0000-0000-000000000001";
  const loms = Array.from(
    new Map(
      fallbackFiscalYears.map((fiscalYear) => [
        fiscalYear.lomName,
        { id: defaultLomId, name: fiscalYear.lomName }
      ])
    ).values()
  );

  return {
    fiscalYears: fallbackFiscalYears.map((fiscalYear) => ({
      id: fiscalYear.id,
      year: fiscalYear.year,
      name: fiscalYear.name,
      lomId: defaultLomId,
      lomName: fiscalYear.lomName
    })),
    loms,
    committees: fallbackCommittees.map((committee) => ({
      id: committee.id,
      fiscalYearId: committee.fiscalYearId,
      name: committee.name
    })),
    members: fallbackMembers.map((member) => ({
      id: member.id,
      name: `${member.lastName} ${member.firstName}`
    }))
  };
}

async function fetchAnnouncements(): Promise<AnnouncementQueryResult<Announcement[]>> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      data: announcements,
      error: "Supabase環境変数が未設定のため、仮データを表示しています。",
      source: "fallback"
    };
  }

  try {
    // TODO: Supabase Auth導入時に、LOMと権限に応じた閲覧条件を追加する。
    const { data, error } = await supabase
      .from("announcements")
      .select(announcementSelect)
      .is("deleted_at", null)
      .order("publish_start_at", { ascending: false });

    if (error) throw new Error(error.message);

    return {
      data: ((data ?? []) as unknown as AnnouncementRow[]).map(toAnnouncement),
      error: null,
      source: "supabase"
    };
  } catch (error) {
    return {
      data: announcements,
      error: `Supabaseからお知らせを取得できませんでした。仮データを表示しています。(${error instanceof Error ? error.message : "unknown"})`,
      source: "fallback"
    };
  }
}

async function fetchAnnouncementById(id: string): Promise<AnnouncementQueryResult<Announcement | undefined>> {
  const result = await fetchAnnouncements();
  return {
    data: result.data.find((announcement) => announcement.id === id) ?? getAnnouncement(id),
    error: result.error,
    source: result.source
  };
}

async function fetchLatestAnnouncements(limit = 3): Promise<AnnouncementQueryResult<Announcement[]>> {
  const result = await fetchAnnouncements();
  return {
    ...result,
    data: result.data.slice(0, limit)
  };
}

async function fetchFormOptions(): Promise<AnnouncementQueryResult<AnnouncementFormOptions>> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      data: fallbackFormOptions(),
      error: "Supabase環境変数が未設定のため、仮データを表示しています。",
      source: "fallback"
    };
  }

  try {
    const [fiscalYears, loms, committees, members] = await Promise.all([
      supabase.from("fiscal_years").select("id, lom_id, year, name, loms(id, name)").order("year", { ascending: false }),
      supabase.from("loms").select("id, name").order("name", { ascending: true }),
      supabase
        .from("committees")
        .select("id, fiscal_year_id, name")
        .is("deleted_at", null)
        .order("sort_order", { ascending: true }),
      supabase.from("members").select("id, last_name, first_name").order("last_name", { ascending: true })
    ]);
    const error = fiscalYears.error ?? loms.error ?? committees.error ?? members.error;

    if (error) throw new Error(error.message);

    return {
      data: {
        fiscalYears: ((fiscalYears.data ?? []) as unknown as FiscalYearRow[]).map((fiscalYear) => {
          const lom = firstRelation(fiscalYear.loms);
          return {
            id: fiscalYear.id,
            year: fiscalYear.year,
            name: fiscalYear.name,
            lomId: fiscalYear.lom_id,
            lomName: lom?.name ?? "未設定LOM"
          };
        }),
        loms: ((loms.data ?? []) as unknown as LomRow[]).map((lom) => ({ id: lom.id, name: lom.name })),
        committees: ((committees.data ?? []) as unknown as CommitteeRow[]).map((committee) => ({
          id: committee.id,
          fiscalYearId: committee.fiscal_year_id,
          name: committee.name
        })),
        members: ((members.data ?? []) as unknown as MemberRow[]).map((member) => ({
          id: member.id,
          name: `${member.last_name} ${member.first_name}`
        }))
      },
      error: null,
      source: "supabase"
    };
  } catch (error) {
    return {
      data: fallbackFormOptions(),
      error: `Supabaseからお知らせ作成用のデータを取得できませんでした。仮データを表示しています。(${error instanceof Error ? error.message : "unknown"})`,
      source: "fallback"
    };
  }
}

export const announcementService = {
  getAnnouncements: fetchAnnouncements,
  getAnnouncementById: fetchAnnouncementById,
  getLatestAnnouncements: fetchLatestAnnouncements,
  getFormOptions: fetchFormOptions,
  getFallbackAnnouncementById: getAnnouncement,
  getAnnouncementAuthor,
  announcementTypeLabels,
  announcementVisibilityLabels,
  announcementImportanceLabels,
  announcementTypeTones,
  announcementImportanceTones
};
