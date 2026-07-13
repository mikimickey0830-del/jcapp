import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

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
            登録されたメールアドレスとパスワードでログインしてください。
          </p>
        </div>
        <Suspense fallback={<LoginFormLoading />}>
          <LoginForm />
        </Suspense>
      </section>
      <p className="pb-3 text-center text-xs leading-5 text-slate-500">
        アカウントがない場合は、JC-App管理者へご連絡ください。
      </p>
    </main>
  );
}

function LoginFormLoading() {
  return <div className="h-52 animate-pulse rounded-md bg-slate-100" />;
}
