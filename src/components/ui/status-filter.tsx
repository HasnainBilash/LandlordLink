import Link from "next/link";

import { cn } from "@/lib/utils";

type StatusFilterOption = {
  label: string;
  value: string;
};

type StatusFilterProps = {
  options: StatusFilterOption[];
  active: string;
  hrefFor: (value: string) => string;
};

export function StatusFilter({ options, active, hrefFor }: StatusFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = option.value === active;

        return (
          <Link
            key={option.value || "all"}
            href={hrefFor(option.value)}
            scroll={false}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                : "bg-card text-muted-foreground ring-1 ring-foreground/[0.08] hover:text-foreground hover:ring-foreground/20 dark:ring-white/[0.1]"
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
