"use client";

import { signOut } from "next-auth/react";
import { Sparkles } from "lucide-react";

// Shown at the top of the app while signed in to a demo account.
export function DemoBanner() {
  return (
    <div className="bg-brand-gradient text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-xs sm:text-sm md:px-8">
        <span className="flex items-center gap-1.5">
          <Sparkles className="size-4 shrink-0" />
          You&apos;re exploring the demo — feel free to click around. Changes reset every night.
        </span>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/register" })}
          className="font-semibold underline underline-offset-4 hover:no-underline"
        >
          Create your own account
        </button>
      </div>
    </div>
  );
}
