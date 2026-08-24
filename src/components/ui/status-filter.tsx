import Link from "next/link";

import { cn } from "@/lib/utils";

type StatusFilterOption = {
  label: string;
  value: string;
};

type StatusFilterProps = {
  basePath: string;
  paramName?: string;
  options: StatusFilterOption[];
  active: string;
};

export function StatusFilter({
  basePath,
  paramName = "status",
  options,
  active,
}: StatusFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = option.value === active;

        const href = option.value
          ? `${basePath}?${paramName}=${option.value}`
          : basePath;

        return (
          <Link
            key={option.value || "all"}
            href={href}
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