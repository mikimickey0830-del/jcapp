import Link from "next/link";
import type { Member } from "@/types/member";

type MemberFormProps = {
  mode: "create" | "edit";
  member?: Member;
};

export function MemberForm({ mode, member }: MemberFormProps) {
  const isEdit = mode === "edit";

  return (
    <form className="space-y-5">
      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">会員基本情報</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          年度をまたいで引き継ぐ情報です。役職、委員会、権限は年度管理側で扱います。
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <TextField label="姓" name="lastName" defaultValue={member?.lastName} />
          <TextField label="名" name="firstName" defaultValue={member?.firstName} />
          <TextField label="姓 フリガナ" name="lastNameKana" defaultValue={member?.lastNameKana} />
          <TextField label="名 フリガナ" name="firstNameKana" defaultValue={member?.firstNameKana} />
        </div>

        <div className="mt-3 space-y-3">
          <TextField label="メール" name="email" type="email" defaultValue={member?.email} />
          <TextField label="電話番号" name="phone" type="tel" defaultValue={member?.phone} />
          <TextField label="所属LOM" name="lomName" defaultValue={member?.lomName ?? "玉島青年会議所"} />
          <TextField
            label="入会年度"
            name="joinedYear"
            type="number"
            defaultValue={String(member?.joinedYear ?? 2026)}
          />
        </div>

        <label className="mt-3 block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">ステータス</span>
          <select
            className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
            defaultValue={member?.status ?? "active"}
            name="status"
          >
            <option value="active">在籍</option>
            <option value="inactive">休会</option>
            <option value="graduated">卒業</option>
          </select>
        </label>
      </section>

      <section className="rounded-md border border-dashed border-jc-line bg-jc-sky p-4">
        <h2 className="text-base font-bold text-jc-navy">年度別情報</h2>
        <p className="mt-1 text-sm leading-6 text-slate-700">
          役職、委員会、権限は年度ごとに変わるため、この画面では保存対象にしません。
          後続フェーズで年度管理から編集します。
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link
          className="flex min-h-12 items-center justify-center rounded-md border border-jc-line bg-white px-4 text-sm font-bold text-slate-700"
          href={isEdit && member ? `/members/${member.id}` : "/members"}
        >
          キャンセル
        </Link>
        <button
          className="min-h-12 rounded-md bg-jc-blue px-4 text-sm font-bold text-white shadow-soft"
          type="button"
        >
          {isEdit ? "更新する" : "登録する"}
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
  defaultValue?: string | number;
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
