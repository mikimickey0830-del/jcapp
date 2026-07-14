import { getAppEnvironment } from "@/lib/environment";

const toneByEnvironment = {
  development: "border-amber-200 bg-amber-50 text-amber-800",
  test: "border-violet-200 bg-violet-50 text-violet-800",
  production: "border-emerald-200 bg-emerald-50 text-emerald-800"
};

export function EnvironmentBadge() {
  const environment = getAppEnvironment();

  return (
    <span className={`inline-flex min-h-7 items-center rounded-full border px-2 text-[11px] font-bold ${toneByEnvironment[environment.value]}`}>
      {environment.label}
    </span>
  );
}
