import { AppShell } from "@/components/AppShell";

export default function AssignmentYearLoading() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded-md bg-slate-200" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((item) => (
            <div className="h-20 animate-pulse rounded-md bg-white" key={item} />
          ))}
        </div>
        {[0, 1, 2].map((item) => (
          <div className="h-36 animate-pulse rounded-md bg-white" key={item} />
        ))}
      </div>
    </AppShell>
  );
}
