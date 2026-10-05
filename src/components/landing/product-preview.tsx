import { CheckCircle2, TrendingUp } from "lucide-react";

// A live-looking slice of the landlord dashboard for the landing page,
// drawn with real UI styles rather than a screenshot, so it stays sharp
// and follows the light/dark theme.

const flats = [
  { no: "101", who: "Karim Ahmed", tone: "paid" },
  { no: "102", who: "Fatima Begum", tone: "paid" },
  { no: "103", who: "Rezaul Islam", tone: "late" },
  { no: "104", who: "Vacant", tone: "vacant" },
  { no: "201", who: "Nusrat Jahan", tone: "partial" },
  { no: "202", who: "Shakil Hossain", tone: "paid" },
] as const;

const toneClasses = {
  paid: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  late: "bg-red-500/10 text-red-700 dark:text-red-300",
  partial: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  vacant: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
} as const;

const toneLabels = { paid: "Paid", late: "Overdue", partial: "Partly paid", vacant: "Vacant" } as const;

const bars = [38, 52, 47, 61, 58, 72];

export function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      {/* Browser-ish frame */}
      <div className="rounded-3xl bg-card/80 p-2 shadow-2xl shadow-blue-950/15 ring-1 ring-foreground/10 backdrop-blur dark:shadow-black/40">
        <div className="flex items-center gap-1.5 px-3 py-2">
          <span className="size-2.5 rounded-full bg-red-400/80" />
          <span className="size-2.5 rounded-full bg-amber-400/80" />
          <span className="size-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-3 h-5 flex-1 rounded-md bg-muted text-[10px] leading-5 text-muted-foreground">
            &nbsp;&nbsp;landlordlink.app/dashboard
          </span>
        </div>

        <div className="space-y-3 rounded-2xl bg-background p-4">
          <div className="grid grid-cols-3 gap-2.5">
            <MiniStat label="Collected" value="৳3,45,000" accent="text-emerald-600 dark:text-emerald-400" />
            <MiniStat label="Occupancy" value="92%" />
            <MiniStat label="Outstanding" value="৳41,500" accent="text-red-600 dark:text-red-400" />
          </div>

          <div className="rounded-xl bg-card p-3 ring-1 ring-foreground/[0.07]">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold">Green Valley · Floor 1–2</p>
              <p className="text-[10px] text-muted-foreground">6 flats</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {flats.map((flat) => (
                <div key={flat.no} className="rounded-lg border bg-background p-2">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[11px] font-semibold">Flat {flat.no}</p>
                  </div>
                  <p className="truncate text-[10px] text-muted-foreground">{flat.who}</p>
                  <span className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-medium ${toneClasses[flat.tone]}`}>
                    {toneLabels[flat.tone]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-card p-3 ring-1 ring-foreground/[0.07]">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold">Rent collected</p>
              <p className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="size-3" /> +18% this month
              </p>
            </div>
            <div className="flex h-16 items-end gap-2">
              {bars.map((height, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t-md ${i === bars.length - 1 ? "bg-brand-gradient" : "bg-primary/20"}`}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating toast */}
      <div className="absolute -bottom-5 -left-3 flex items-center gap-2.5 rounded-2xl bg-card px-3.5 py-2.5 text-xs shadow-xl ring-1 ring-foreground/10 sm:-left-8">
        <CheckCircle2 className="size-4.5 text-emerald-500" />
        <div>
          <p className="font-semibold">Payment of ৳18,000 recorded</p>
          <p className="text-[10px] text-muted-foreground">Flat 103 · September rent</p>
        </div>
      </div>

      {/* Floating request card */}
      <div className="absolute -top-5 -right-2 hidden rounded-2xl bg-card px-3.5 py-2.5 text-xs shadow-xl ring-1 ring-foreground/10 sm:block sm:-right-6">
        <p className="font-semibold">New request · Flat 104</p>
        <p className="text-[10px] text-muted-foreground">Tanvir Alam wants to move in</p>
        <div className="mt-1.5 flex gap-1.5">
          <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">Approve</span>
          <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium">Reject</span>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl bg-card p-2.5 ring-1 ring-foreground/[0.07]">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold tabular-nums ${accent ?? ""}`}>{value}</p>
    </div>
  );
}
