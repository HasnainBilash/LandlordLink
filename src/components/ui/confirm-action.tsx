"use client";

import { useState, type ReactElement, type ReactNode } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useSingleFlightAction } from "@/hooks/use-single-flight-action";
import type { ActionResult } from "@/types/action-result";

type ConfirmActionProps = {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pendingLabel?: string;
  destructive?: boolean;
  // The element that opens the confirmation, e.g. <Button>Delete</Button>.
  // Leave it out and pass open/onOpenChange to open it from elsewhere.
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  action: () => Promise<ActionResult | void>;
  onSuccess?: (result: ActionResult) => void;
};

// A confirmation dialog for one-click actions (delete, reject, end lease,
// write off). Shows the server's message as a toast either way.
export function ConfirmAction({
  title,
  description,
  confirmLabel,
  pendingLabel = "Working...",
  destructive = false,
  trigger,
  open: controlledOpen,
  onOpenChange,
  action,
  onSuccess,
}: ConfirmActionProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const { run, isPending } = useSingleFlightAction(action);

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  async function handleConfirm() {
    const result = await run();

    if (!result) return;

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    setOpen(false);
    toast.success(result.message);
    onSuccess?.(result);
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {trigger && <AlertDialogTrigger render={trigger} />}

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? "destructive" : "default"}
            disabled={isPending}
            onClick={handleConfirm}
          >
            {isPending ? pendingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
