"use client";

import { createJoinRequest } from "@/actions/join-request/create-join-request";

import { Button } from "@/components/ui/button";
import { FieldError, FormError } from "@/components/ui/field-error";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useActionForm } from "@/hooks/use-action-form";

type RequestFlatButtonProps = {
  flatId: string;
  flatLabel: string;
  // Pre-filled when the tenant arrived by entering the building's code.
  accessCode?: string;
};

export function RequestFlatButton({
  flatId,
  flatLabel,
  accessCode,
}: RequestFlatButtonProps) {
  return (
    <FormDialog
      title={`Request ${flatLabel}`}
      description="The landlord will review your request and get back to you."
      trigger={<Button size="sm">Request</Button>}
    >
      {(close) => (
        <RequestFlatForm flatId={flatId} accessCode={accessCode} onSuccess={close} />
      )}
    </FormDialog>
  );
}

function RequestFlatForm({
  flatId,
  accessCode,
  onSuccess,
}: {
  flatId: string;
  accessCode?: string;
  onSuccess: () => void;
}) {
  const { submit, isPending, errors, message } = useActionForm(
    (formData) => createJoinRequest(flatId, formData),
    { onSuccess }
  );

  return (
    <form action={submit} className="space-y-4">
      <FormError message={message} />

      <div className="space-y-1.5">
        <Label htmlFor="accessCode">Building access code</Label>
        <Input
          id="accessCode"
          name="accessCode"
          required
          autoComplete="off"
          placeholder="e.g. 7K4XPQ2M"
          defaultValue={accessCode}
          className="font-mono uppercase placeholder:normal-case"
        />
        <p className="text-xs text-muted-foreground">
          The landlord gives you this code after you&apos;ve talked to them.
        </p>
        <FieldError errors={errors.accessCode} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Message to the landlord (optional)</Label>
        <Textarea
          id="message"
          name="message"
          rows={3}
          placeholder="e.g. when you'd like to move in"
        />
        <FieldError errors={errors.message} />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Sending..." : "Send request"}
      </Button>
    </form>
  );
}
