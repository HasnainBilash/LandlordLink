import { ReactNode } from "react";

export function AuthCard({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-card p-6 shadow-xl shadow-blue-950/[0.06] ring-1 ring-foreground/[0.07] sm:p-8 dark:shadow-black/30 dark:ring-white/[0.08]">
      {children}
    </div>
  );
}
