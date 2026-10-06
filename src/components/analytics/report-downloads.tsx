"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// CSV files for a spreadsheet or an accountant (src/lib/exports.ts).
const DOWNLOADS = [
  { kind: "rent-roll", label: "Rent roll", hint: "Current tenants, their rent and what they owe" },
  { kind: "payments", label: "Payments", hint: "Every payment in the last 12 months" },
  { kind: "owed", label: "What's owed", hint: "Each unpaid rent and bill, oldest first" },
];

export function ReportDownloads() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        <Download />
        Download
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-64">
        {DOWNLOADS.map((download) => (
          <DropdownMenuItem
            key={download.kind}
            render={<a href={`/api/export/${download.kind}`} download />}
            className="flex-col items-start gap-0.5"
          >
            <span className="font-medium">{download.label} (CSV)</span>
            <span className="text-xs text-muted-foreground">{download.hint}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
