"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase?.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      className="min-h-10 rounded-md px-3 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:text-slate-400"
      disabled={isSigningOut}
      onClick={handleLogout}
      type="button"
    >
      {isSigningOut ? "ログアウト中" : "ログアウト"}
    </button>
  );
}
