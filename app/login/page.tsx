import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col justify-between bg-white px-6 py-8 shadow-soft">
      <section className="pt-8">
        <div className="mb-8">
          <p className="text-sm font-semibold text-jc-blue">Tamashima Junior Chamber</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-jc-navy">
            玉島青年会議所
            <br />
            JC-App
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            年度ごとの役職、委員会、予定、資料をまとめて確認できます。
          </p>
        </div>

        <form className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">メールアドレス</span>
            <input
              autoComplete="email"
              className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-4 text-base outline-none transition focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="name@example.com"
              type="email"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">パスワード</span>
            <input
              autoComplete="current-password"
              className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-4 text-base outline-none transition focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="パスワード"
              type="password"
            />
          </label>

          {/* Auth wiring will be connected to Supabase in the next phase. */}
          <Link
            className="flex min-h-12 w-full items-center justify-center rounded-md bg-jc-blue px-4 text-base font-bold text-white shadow-soft transition hover:bg-blue-700"
            href="/"
          >
            ログイン
          </Link>
        </form>
      </section>

      <p className="pb-3 text-center text-xs leading-5 text-slate-500">
        Supabase Auth 接続前の画面雛形です。
        <br />
        接続キーは環境変数で管理します。
      </p>
    </main>
  );
}
