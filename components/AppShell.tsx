import Link from "next/link";
import type { ReactNode } from "react";
import { EnvironmentBadge } from "@/components/EnvironmentBadge";
import { LogoutButton } from "@/components/LogoutButton";

type AppShellProps = {
  children: ReactNode;
};

const navItems = [
  { href: "/", label: "ホーム", icon: "H" },
  { href: "/schedule", label: "予定", icon: "S" },
  { href: "/attendance", label: "出欠", icon: "A" },
  { href: "/documents", label: "資料", icon: "D" },
  { href: "/committees", label: "委員会", icon: "C" },
  { href: "/members", label: "会員", icon: "M" }
];

export function AppShell({ children }: AppShellProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-slate-50 shadow-soft">
      <div className="flex items-center justify-end gap-2 px-2 pt-2">
        <EnvironmentBadge />
        <Link
          aria-label="設定"
          className="inline-flex min-h-8 items-center rounded-md px-2 text-xs font-bold text-jc-blue hover:bg-jc-sky"
          href="/settings"
        >
          設定
        </Link>
        <LogoutButton />
      </div>
      <div className="flex-1 px-5 pb-24 pt-1">{children}</div>
      <nav className="fixed bottom-0 left-1/2 z-10 w-full max-w-[430px] -translate-x-1/2 border-t border-jc-line bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 backdrop-blur">
        <div className="grid grid-cols-6 gap-1">
          {navItems.map((item) => (
            <Link
              aria-label={item.label}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-[10px] font-medium text-slate-600 transition hover:bg-jc-sky hover:text-jc-navy"
              href={item.href}
              key={item.label}
            >
              <span className="grid size-6 place-items-center rounded-full bg-jc-sky text-xs font-bold text-jc-blue">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </main>
  );
}
