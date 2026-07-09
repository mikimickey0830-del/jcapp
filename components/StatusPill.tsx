type StatusPillProps = {
  label: string;
  tone?: "blue" | "green" | "amber" | "red";
};

const toneClassName = {
  blue: "bg-jc-sky text-jc-blue",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-rose-50 text-rose-700"
};

export function StatusPill({ label, tone = "blue" }: StatusPillProps) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneClassName[tone]}`}>
      {label}
    </span>
  );
}
