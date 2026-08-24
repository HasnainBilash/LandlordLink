import { notFound } from "next/navigation";

import { getBuilding } from "@/actions/building/get-building";
import { createNotice } from "@/actions/notice/create-notice";

import { NoticeForm } from "@/components/notice/notice-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { BackLink } from "@/components/ui/back-link";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function NewNoticePage({ params }: PageProps) {
  const { id } = await params;

  const building = await getBuilding(id);

  if (!building) {
    notFound();
  }

  async function createAction(formData: FormData) {
    "use server";

    await createNotice(id, formData);
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
            { label: "New" },
          ]}
        />

        <BackLink
          href={`/dashboard/buildings/${id}/notices`}
          label="Notices"
        />
      </div>

      <div>
        <h1 className="text-3xl font-bold">New Notice</h1>
        <p className="text-muted-foreground">{building.name}</p>
      </div>

      <NoticeForm action={createAction} submitText="Publish Notice" />
    </div>
  );
}
