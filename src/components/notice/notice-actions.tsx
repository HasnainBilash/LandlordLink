"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";

import { createNotice } from "@/actions/notice/create-notice";
import { deleteNotice } from "@/actions/notice/delete-notice";
import { updateNotice } from "@/actions/notice/update-notice";

import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { FormDialog } from "@/components/ui/form-dialog";

import { NoticeForm } from "./notice-form";

export function NewNoticeButton({ buildingId }: { buildingId: string }) {
  return (
    <FormDialog
      title="New notice"
      description="Tenants of this building see it on their Home page."
      trigger={
        <Button>
          <Plus />
          New notice
        </Button>
      }
    >
      {(close) => (
        <NoticeForm
          action={(formData) => createNotice(buildingId, formData)}
          submitText="Publish notice"
          onSuccess={close}
        />
      )}
    </FormDialog>
  );
}

type NoticeItemActionsProps = {
  notice: {
    id: string;
    title: string;
    content: string;
    audience: "ALL" | "TENANTS" | "LANDLORDS";
    expiresAt: Date | null;
  };
};

export function NoticeItemActions({ notice }: NoticeItemActionsProps) {
  return (
    <div className="flex gap-1">
      <FormDialog
        title="Edit notice"
        trigger={
          <Button size="sm" variant="ghost">
            <Pencil />
            Edit
          </Button>
        }
      >
        {(close) => (
          <NoticeForm
            action={(formData) => updateNotice(notice.id, formData)}
            submitText="Save changes"
            defaultValues={notice}
            onSuccess={close}
          />
        )}
      </FormDialog>

      <ConfirmAction
        title="Delete this notice?"
        description={`"${notice.title}" will be removed for everyone.`}
        confirmLabel="Delete"
        pendingLabel="Deleting..."
        destructive
        trigger={
          <Button size="sm" variant="ghost" aria-label="Delete notice">
            <Trash2 />
          </Button>
        }
        action={() => deleteNotice(notice.id)}
      />
    </div>
  );
}
