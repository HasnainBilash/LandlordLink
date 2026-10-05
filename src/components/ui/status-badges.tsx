import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Colour-coded status pills used across the app, so the same status
// always looks the same.

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "muted";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "border-border bg-background text-foreground",
  success:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  warning:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  danger: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  info: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  muted: "bg-muted text-muted-foreground",
};

function ToneBadge({
  tone,
  children,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("border-transparent", TONE_CLASSES[tone], className)}>
      {children}
    </Badge>
  );
}

export type FlatStatus = "VACANT" | "OCCUPIED" | "MAINTENANCE";

const FLAT_STATUS: Record<FlatStatus, { label: string; tone: Tone }> = {
  VACANT: { label: "Vacant", tone: "info" },
  OCCUPIED: { label: "Occupied", tone: "success" },
  MAINTENANCE: { label: "Maintenance", tone: "warning" },
};

export function FlatStatusBadge({ status }: { status: FlatStatus }) {
  const { label, tone } = FLAT_STATUS[status];
  return <ToneBadge tone={tone}>{label}</ToneBadge>;
}

export type PaymentStatus =
  | "PENDING"
  | "PARTIAL"
  | "PAID"
  | "OVERDUE"
  | "WRITTEN_OFF";

const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "Due", tone: "neutral" },
  PARTIAL: { label: "Partly paid", tone: "warning" },
  PAID: { label: "Paid", tone: "success" },
  OVERDUE: { label: "Overdue", tone: "danger" },
  WRITTEN_OFF: { label: "Written off", tone: "muted" },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, tone } = PAYMENT_STATUS[status];
  return <ToneBadge tone={tone}>{label}</ToneBadge>;
}

export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "ENDED";

const REQUEST_STATUS: Record<RequestStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "Pending", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Rejected", tone: "danger" },
  ENDED: { label: "Lease ended", tone: "muted" },
};

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const { label, tone } = REQUEST_STATUS[status];
  return <ToneBadge tone={tone}>{label}</ToneBadge>;
}

export function HiddenBadge() {
  return <ToneBadge tone="muted">Hidden from tenants</ToneBadge>;
}

export function OverdueBadge() {
  return <ToneBadge tone="danger">Overdue</ToneBadge>;
}

export function NewBadge() {
  return <ToneBadge tone="info">New</ToneBadge>;
}
