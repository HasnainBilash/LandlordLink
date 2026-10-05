"use client";

import { useState, type ReactElement, type ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type FormDialogProps = {
  title: string;
  description?: ReactNode;
  // The element that opens the dialog, e.g. <Button>Add floor</Button>.
  // Leave it out and pass open/onOpenChange to control the dialog from
  // elsewhere (e.g. a dropdown menu item).
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  // Receives `close` so the form can close the dialog after saving.
  children: (close: () => void) => ReactNode;
};

export function FormDialog({
  title,
  description,
  trigger,
  open: controlledOpen,
  onOpenChange,
  className,
  children,
}: FormDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}

      <DialogContent
        className={cn("max-h-[90vh] overflow-y-auto sm:max-w-lg", className)}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {children(() => setOpen(false))}
      </DialogContent>
    </Dialog>
  );
}
