"use client";

import { Fragment } from "react";
import {
  CheckCircle2,
  CircleSlash,
  Clock,
  Loader2,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// A change the assistant prepared, as the chat tracks it.
export type ActionStatus = "pending" | "running" | "done" | "failed" | "cancelled";

export type ChatAction = {
  id: string;
  title: string;
  details: { label: string; value: string }[];
  status: ActionStatus;
  // The app's message once it ran (or why it couldn't).
  result?: string;
};

const STATUS: Record<ActionStatus, { label: string; icon: LucideIcon; className: string }> = {
  pending: { label: "Waiting for you", icon: Clock, className: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  running: { label: "Working…", icon: Loader2, className: "bg-primary/10 text-primary dark:bg-primary/20" },
  done: { label: "Done", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  failed: { label: "Didn't go through", icon: XCircle, className: "bg-red-500/10 text-red-700 dark:text-red-300" },
  cancelled: { label: "Cancelled", icon: CircleSlash, className: "bg-muted text-muted-foreground" },
};

const OUTCOMES: Record<ActionStatus, string> = {
  pending: "not confirmed yet",
  running: "being made",
  done: "confirmed by the landlord and done",
  failed: "failed",
  cancelled: "cancelled by the landlord",
};

// Tells the model, in later messages, what became of each change.
export function describeOutcomes(actions: ChatAction[]) {
  return actions
    .map(
      (action) =>
        `[${action.title} (${action.details.map((detail) => `${detail.label}: ${detail.value}`).join(", ")}): ${OUTCOMES[action.status]}${action.result ? ` — ${action.result}` : ""}]`
    )
    .join("\n");
}

function ActionDetails({ details, compact = false }: { details: ChatAction["details"]; compact?: boolean }) {
  return (
    <dl className={cn("grid grid-cols-[auto_1fr] gap-x-3 gap-y-1", compact ? "text-xs" : "text-sm")}>
      {details.map((detail) => (
        <Fragment key={detail.label}>
          <dt className="text-muted-foreground">{detail.label}</dt>
          <dd className={cn("min-w-0 font-medium break-words whitespace-pre-wrap", compact && "line-clamp-3")}>
            {detail.value}
          </dd>
        </Fragment>
      ))}
    </dl>
  );
}

// The change as a card in the chat, with its current status.
export function ActionCard({ action, onReview }: { action: ChatAction; onReview: () => void }) {
  const status = STATUS[action.status];

  return (
    <div data-testid="assistant-action" className="rounded-xl border bg-card p-3 text-card-foreground">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{action.title}</p>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
            status.className
          )}
        >
          <status.icon className={cn("size-3", action.status === "running" && "animate-spin")} />
          {status.label}
        </span>
      </div>

      <ActionDetails details={action.details} compact />

      {action.result && action.status !== "pending" && (
        <p className="mt-2 text-xs text-muted-foreground">{action.result}</p>
      )}

      {action.status === "pending" && (
        <Button size="sm" className="mt-3 w-full" onClick={onReview}>
          Review &amp; confirm
        </Button>
      )}
    </div>
  );
}

// The confirmation popup: nothing changes until the landlord confirms.
export function ConfirmActionsDialog({
  actions,
  open,
  deciding,
  onConfirm,
  onCancel,
  onDismiss,
}: {
  actions: ChatAction[];
  open: boolean;
  deciding: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  // Closed without deciding (Esc): the card keeps a "Review" button.
  onDismiss: () => void;
}) {
  const single = actions.length === 1;

  return (
    <AlertDialog
      open={open && actions.length > 0}
      onOpenChange={(next) => {
        if (!next && !deciding) onDismiss();
      }}
    >
      <AlertDialogContent className="data-[size=default]:sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {single ? `${actions[0].title}?` : `Make these ${actions.length} changes?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            The assistant prepared this. Check the details — nothing changes
            until you confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="max-h-[50vh] space-y-3 overflow-y-auto">
          {actions.map((action) => (
            <div key={action.id} className="rounded-xl bg-muted/60 p-3 text-left">
              {!single && <p className="mb-2 text-sm font-semibold">{action.title}</p>}
              <ActionDetails details={action.details} />
            </div>
          ))}
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={deciding}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={deciding}>
            {deciding && <Loader2 className="animate-spin" />}
            {deciding ? "Working…" : single ? "Confirm" : `Confirm all (${actions.length})`}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
