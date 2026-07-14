import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AuthMember } from "@/types/auth";

type TestDataRunRow = {
  id: string;
  record_ids: { eventIds?: string[]; announcementIds?: string[] } | null;
};

type TestDataStatus = {
  hasActiveData: boolean;
  activeRunCount: number;
};

const migrationMessage = "開発用テストデータの準備ができていません。environment-test-data-migration.sql を実行してください。";

function failureMessage(error: { message?: string } | null) {
  if (error?.message?.includes("development_test_data_runs")) return migrationMessage;
  return "テストデータを処理できませんでした。Supabase設定と権限を確認してください。";
}

async function loadCurrentFiscalYear(member: AuthMember) {
  const supabase = createClient();
  if (!supabase) return { fiscalYear: null, lomName: null, error: "Supabase環境変数が未設定です。" };

  const [{ data: fiscalYear, error: fiscalYearError }, { data: lom, error: lomError }] = await Promise.all([
    supabase
      .from("fiscal_years")
      .select("id")
      .eq("lom_id", member.lomId)
      .or("is_current.eq.true,status.eq.current")
      .order("year", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("loms").select("name").eq("id", member.lomId).maybeSingle()
  ]);

  if (fiscalYearError || lomError) return { fiscalYear: null, lomName: null, error: failureMessage(fiscalYearError ?? lomError) };
  if (!fiscalYear || !lom) return { fiscalYear: null, lomName: null, error: "現在年度またはLOMが見つかりません。年度設定を確認してください。" };
  return { fiscalYear, lomName: lom.name, error: null };
}

async function getStatus(member: AuthMember): Promise<{ data: TestDataStatus; error: string | null }> {
  const supabase = createClient();
  if (!supabase) return { data: { hasActiveData: false, activeRunCount: 0 }, error: "Supabase環境変数が未設定です。" };

  const { data, error } = await supabase
    .from("development_test_data_runs")
    .select("id")
    .eq("lom_id", member.lomId)
    .is("deleted_at", null);

  if (error) return { data: { hasActiveData: false, activeRunCount: 0 }, error: failureMessage(error) };
  return { data: { hasActiveData: Boolean(data?.length), activeRunCount: data?.length ?? 0 }, error: null };
}

async function create(member: AuthMember): Promise<{ error: string | null }> {
  const supabase = createClient();
  if (!supabase) return { error: "Supabase環境変数が未設定です。" };

  const status = await getStatus(member);
  if (status.error) return { error: status.error };
  if (status.data.hasActiveData) return { error: "作成済みの開発用テストデータがあります。削除後にもう一度作成してください。" };

  const current = await loadCurrentFiscalYear(member);
  if (current.error || !current.fiscalYear || !current.lomName) return { error: current.error ?? "現在年度を確認できませんでした。" };

  const now = new Date();
  const startsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  startsAt.setHours(18, 30, 0, 0);
  const endsAt = new Date(startsAt.getTime() + 90 * 60 * 1000);

  let eventId: string | null = null;
  let announcementId: string | null = null;
  try {
    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        lom_id: member.lomId,
        fiscal_year_id: current.fiscalYear.id,
        title: "【開発テスト】サンプル予定",
        event_type: "other",
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        venue: "テスト会場",
        description: "開発環境の画面確認用に作成されたテストデータです。",
        requires_attendance: false,
        created_by: member.id
      })
      .select("id")
      .single();
    if (eventError || !event) throw eventError ?? new Error("テスト予定を作成できませんでした。");
    eventId = event.id;

    const { data: announcement, error: announcementError } = await supabase
      .from("announcements")
      .insert({
        lom_id: member.lomId,
        fiscal_year_id: current.fiscalYear.id,
        title: "【開発テスト】サンプルお知らせ",
        body: "開発環境の画面確認用に作成されたテストデータです。削除操作で安全に片付けられます。",
        announcement_type: "other",
        target_lom: current.lomName,
        visibility: "admins",
        importance: "normal",
        publish_start_at: now.toISOString(),
        author_member_id: member.id
      })
      .select("id")
      .single();
    if (announcementError || !announcement) throw announcementError ?? new Error("テストお知らせを作成できませんでした。");
    announcementId = announcement.id;

    const { error: runError } = await supabase.from("development_test_data_runs").insert({
      lom_id: member.lomId,
      created_by_member_id: member.id,
      record_ids: { eventIds: [eventId], announcementIds: [announcementId] }
    });
    if (runError) throw runError;
    return { error: null };
  } catch (error) {
    // Compensate for partial creation if the run record cannot be stored.
    if (eventId) await supabase.from("events").update({ deleted_at: new Date().toISOString() }).eq("id", eventId).eq("lom_id", member.lomId);
    if (announcementId) await supabase.from("announcements").update({ deleted_at: new Date().toISOString() }).eq("id", announcementId).eq("lom_id", member.lomId);
    return { error: failureMessage(error instanceof Error ? error : null) };
  }
}

async function remove(member: AuthMember): Promise<{ error: string | null }> {
  const supabase = createClient();
  if (!supabase) return { error: "Supabase環境変数が未設定です。" };

  const { data: runs, error: runsError } = await supabase
    .from("development_test_data_runs")
    .select("id, record_ids")
    .eq("lom_id", member.lomId)
    .is("deleted_at", null);
  if (runsError) return { error: failureMessage(runsError) };
  if (!runs?.length) return { error: "削除対象の開発用テストデータはありません。" };

  const typedRuns = runs as TestDataRunRow[];
  const eventIds = typedRuns.flatMap((run) => run.record_ids?.eventIds ?? []);
  const announcementIds = typedRuns.flatMap((run) => run.record_ids?.announcementIds ?? []);
  const deletedAt = new Date().toISOString();

  const operations = [
    eventIds.length
      ? supabase.from("events").update({ deleted_at: deletedAt }).eq("lom_id", member.lomId).in("id", eventIds)
      : Promise.resolve({ error: null }),
    announcementIds.length
      ? supabase.from("announcements").update({ deleted_at: deletedAt }).eq("lom_id", member.lomId).in("id", announcementIds)
      : Promise.resolve({ error: null }),
    supabase.from("development_test_data_runs").update({ deleted_at: deletedAt }).eq("lom_id", member.lomId).is("deleted_at", null)
  ];
  const results = await Promise.all(operations);
  const failed = results.find((result) => result.error);
  return { error: failed?.error ? failureMessage(failed.error) : null };
}

export const developmentTestDataService = { getStatus, create, remove };
