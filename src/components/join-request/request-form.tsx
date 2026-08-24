"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { ActionResult, initialActionState } from "@/types/action-result";

type RequestFormProps = {
  action: (
    prevState: ActionResult,
    formData: FormData
  ) => Promise<ActionResult>;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Submitting..." : "Submit Request"}
    </Button>
  );
}

export function RequestForm({ action }: RequestFormProps) {
  const [state, formAction] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="space-y-6">
      {state.message && !state.success && (
        <p className="text-sm text-red-500">{state.message}</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="accessCode">Building Access Code</Label>

        <Input
          id="accessCode"
          name="accessCode"
          required
          placeholder="e.g. 7K4XPQ2M"
          className="font-mono uppercase"
        />

        <p className="text-sm text-muted-foreground">
          Get this from the building owner after contacting them directly.
        </p>

        {state.errors?.accessCode && (
          <p className="text-sm text-red-500">
            {state.errors.accessCode[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message to Landlord (optional)</Label>

        <Textarea
          id="message"
          name="message"
          placeholder="e.g. preferred move-in date, questions..."
          rows={4}
        />
      </div>

      <SubmitButton />
    </form>
  );
}