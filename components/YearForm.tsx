import Link from "next/link";
import { useYears } from "@/hooks/useYears";

export function YearForm() {
  const { fiscalYears } = useYears();
  const copySource = fiscalYears.find((year) => year.year === 2026);

  return (
    <form className="space-y-5">
      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">年度基本情報</h2>
        <div className="mt-4 space-y-3">
          <TextField defaultValue="2027年度" label="年度名" name="name" />
          <TextField defaultValue="玉島青年会議所" label="LOM" name="lomName" />
          <div className="grid grid-cols-2 gap-3">
            <TextField defaultValue="2027-01-01" label="開始日" name="startsOn" type="date" />
            <TextField defaultValue="2027-12-31" label="終了日" name="endsOn" type="date" />
          </div>
        </div>
      </section>

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">前年度コピー</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          新年度の土台として、前年度の役職、委員会、会員ごとの年度所属を複製します。
          コピー後に新年度の体制へ編集します。
        </p>

        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">コピー元年度</span>
          <select
            className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
            defaultValue="2026"
            name="copyFromYear"
          >
            {fiscalYears.map((year) => (
              <option key={year.year} value={year.year}>
                {year.name}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-4 grid gap-2">
          <CheckRow defaultChecked label="役職マスタをコピー" name="copyPositions" />
          <CheckRow defaultChecked label="委員会マスタをコピー" name="copyCommittees" />
          <CheckRow defaultChecked label="会員ごとの年度所属をコピー" name="copyAssignments" />
          <CheckRow defaultChecked label="会員ごとの年度役職をコピー" name="copyMemberPositions" />
          <CheckRow defaultChecked label="会員ごとの年度権限をコピー" name="copyMemberRoles" />
        </div>

        {copySource ? (
          <div className="mt-4 rounded-md bg-jc-sky p-3">
            <p className="text-xs font-semibold text-slate-500">コピー予定</p>
            <p className="mt-1 text-sm font-bold text-jc-navy">
              役職 {copySource.positions.length}件 / 委員会 {copySource.committees.length}件 / 年度所属{" "}
              {copySource.assignments.length}件
            </p>
          </div>
        ) : null}
      </section>

      <section className="rounded-md border border-dashed border-jc-line bg-slate-50 p-4">
        <h2 className="text-base font-bold text-jc-navy">作成後に編集する情報</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          コピーされた役職、委員会、会員ごとの年度所属・年度役職・年度権限は年度詳細画面で編集する想定です。
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link
          className="flex min-h-12 items-center justify-center rounded-md border border-jc-line bg-white px-4 text-sm font-bold text-slate-700"
          href="/years"
        >
          キャンセル
        </Link>
        <button
          className="min-h-12 rounded-md bg-jc-blue px-4 text-sm font-bold text-white shadow-soft"
          type="button"
        >
          新年度を作成
        </button>
      </div>
    </form>
  );
}

function TextField({
  label,
  name,
  type = "text",
  defaultValue
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
        defaultValue={defaultValue}
        name={name}
        type={type}
      />
    </label>
  );
}

function CheckRow({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-md border border-jc-line bg-slate-50 px-3">
      <input className="size-5 accent-jc-blue" defaultChecked={defaultChecked} name={name} type="checkbox" />
      <span className="text-sm font-semibold text-slate-700">{label}</span>
    </label>
  );
}
