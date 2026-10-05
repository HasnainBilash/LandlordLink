"use client";

import { Button } from "@/components/ui/button";
import { FieldError, FormError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useActionForm } from "@/hooks/use-action-form";
import { toDateInputValue } from "@/lib/format";
import type { ActionResult } from "@/types/action-result";

type NoticeFormProps = {
  action: (formData: FormData) => Promise<ActionResult | void>;
  submitText: string;
  defaultValues?: {
    title: string;
    content: string;
    audience: "ALL" | "TENANTS" | "LANDLORDS";
    expiresAt: Date | null;
  };
  onSuccess?: () => void;
};

export function NoticeForm({
  action,
  submitText,
  defaultValues,
  onSuccess,
}: NoticeFormProps) {
  const { submit, isPending, errors, message } = useActionForm(action, {
    onSuccess,
  });

  return (
    <form action={submit} className="space-y-4">
      <FormError message={message} />

      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          placeholder="Water supply off on Friday"
          defaultValue={defaultValues?.title}
        />
        <FieldError errors={errors.title} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="content">Message</Label>
        <Textarea
          id="content"
          name="content"
          rows={5}
          required
          placeholder="Details for tenants..."
          defaultValue={defaultValues?.content}
        />
        <FieldError errors={errors.content} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="audience">Who can see it</Label>
          <NativeSelect
            id="audience"
            name="audience"
            defaultValue={defaultValues?.audience ?? "ALL"}
          >
            <option value="ALL">Everyone</option>
            <option value="TENANTS">Tenants only</option>
            <option value="LANDLORDS">Only me (private note)</option>
          </NativeSelect>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="expiresAt">Hide after (optional)</Label>
          <Input
            id="expiresAt"
            name="expiresAt"
            type="date"
            defaultValue={
              defaultValues?.expiresAt
                ? toDateInputValue(defaultValues.expiresAt)
                : ""
            }
          />
          <FieldError errors={errors.expiresAt} />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Saving..." : submitText}
      </Button>
    </form>
  );
}
