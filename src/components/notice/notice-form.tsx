"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSingleFlightAction } from "@/hooks/use-single-flight-action";

type NoticeFormProps = {
  action: (formData: FormData) => void | Promise<void>;

  submitText: string;

  defaultValues?: {
    title: string;
    content: string;
    audience: "ALL" | "TENANTS" | "LANDLORDS";
    expiresAt: Date | null;
  };
};

export function NoticeForm({
  action,
  submitText,
  defaultValues,
}: NoticeFormProps) {
  const { run, isPending } = useSingleFlightAction(action);

  return (
    <form action={run} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>

        <Input
          id="title"
          name="title"
          required
          placeholder="Scheduled water shutoff on Friday"
          defaultValue={defaultValues?.title}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>

        <Textarea
          id="content"
          name="content"
          rows={5}
          required
          placeholder="Details for tenants..."
          defaultValue={defaultValues?.content}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="audience">Audience</Label>

          <select
            id="audience"
            name="audience"
            defaultValue={defaultValues?.audience ?? "ALL"}
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="ALL">Everyone</option>
            <option value="TENANTS">Tenants Only</option>
            <option value="LANDLORDS">Landlords Only</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiresAt">Expires On (optional)</Label>

          <Input
            id="expiresAt"
            name="expiresAt"
            type="date"
            defaultValue={
              defaultValues?.expiresAt
                ? new Date(defaultValues.expiresAt).toISOString().slice(0, 10)
                : ""
            }
          />

          <p className="text-sm text-muted-foreground">
            Leave blank for a notice that never expires on its own.
          </p>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Saving..." : submitText}
      </Button>
    </form>
  );
}
