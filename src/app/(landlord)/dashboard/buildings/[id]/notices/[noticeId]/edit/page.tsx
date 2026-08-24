import { notFound } from "next/navigation";

import { getBuilding } from "@/actions/building/get-building";
import { getNotice } from "@/actions/notice/get-notice";
import { updateNotice } from "@/actions/notice/update-notice";

import { NoticeForm } from "@/components/notice/notice-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { BackLink } from "@/components/ui/back-link";

type PageProps = {
  params: Promise<{
    id: string;
    noticeId: string;
  }>;
};

export default async function EditNoticePage({ params }: PageProps) {
  const { id, noticeId } = await params;

  const building = await getBuilding(id);

  if (!building) {
    notFound();
  }

  const notice = await getNotice(noticeId);

  if (!notice || notice.buildingId !== id) {
    notFound();
  }

  async function updateAction(formData: FormData) {
    "use server";

    await updateNotice(noticeId, formData);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Buildings", href: "/dashboard/buildings" },
            { label: building.name, href: `/dashboard/buildings/${id}` },
            { label: "Notices", href: `/dashboard/buildings/${id}/notices` },
            { label: "Edit" },
          ]}
        />

        <BackLink
          href={`/dashboard/buildings/${id}/notices`}
          label="Notices"
        />
      </div>

      <div>
        <h1 className="text-3xl font-bold">Edit Notice</h1>
        <p className="text-muted-foreground">{building.name}</p>
      </div>

      <NoticeForm
        action={updateAction}
        submitText="Save Changes"
        defaultValues={{
          title: notice.title,
          content: notice.content,
          audience: notice.audience,
          expiresAt: notice.expiresAt,
        }}
      />
    </div>
  );
}
