"use client";

import { useState } from "react";
import { toast } from "sonner";

import { useSingleFlightAction } from "@/hooks/use-single-flight-action";
import type { ActionResult } from "@/types/action-result";

type UseActionFormOptions = {
  onSuccess?: (result: ActionResult) => void;
};

// Wires a server action into a <form action={submit}>: blocks double
// submits, keeps field errors for <FieldError>, and shows a toast on
// success. Actions that redirect never resolve, which is fine — the page
// navigates away.
export function useActionForm(
  action: (formData: FormData) => Promise<ActionResult | void>,
  { onSuccess }: UseActionFormOptions = {}
) {
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string | null>(null);
  const { run, isPending } = useSingleFlightAction(action);

  async function submit(formData: FormData) {
    setErrors({});
    setMessage(null);

    const result = await run(formData);

    if (!result) return;

    if (!result.success) {
      setErrors(result.errors);

      // Field errors are shown next to their inputs; anything else is
      // shown at the top of the form.
      if (Object.keys(result.errors).length === 0) {
        setMessage(result.message);
      }

      return;
    }

    toast.success(result.message);
    onSuccess?.(result);
  }

  return { submit, isPending, errors, message };
}
