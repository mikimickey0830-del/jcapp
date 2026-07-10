import { AppShell } from "@/components/AppShell";

export default function AssignmentsLoading() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded-md bg-slate-200" />
        {[0, 1, 2].map((item) => (
          <div className="h-36 animate-pulse rounded-md bg-white" key={item} />
        ))}
      </div>
    </AppShell>
  );
}
