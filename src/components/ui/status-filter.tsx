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
              "rounded-full border px-3 py-1 text-sm transition-colors",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input text-muted-foreground hover:bg-muted"
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
