import { createBuilding } from "@/actions/building/create-building";

import { BuildingForm } from "@/components/building/building-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { BackLink } from "@/components/ui/back-link";

export default function NewBuildingPage() {
  async function createAction(formData: FormData) {
    "use server";

    await createBuilding(formData);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Buildings", href: "/dashboard/buildings" },
            { label: "New" },
          ]}
        />

        <BackLink href="/dashboard/buildings" label="Buildings" />
      </div>

      <div>
        <h1 className="text-3xl font-bold">
          Create Building
        </h1>

        <p className="text-muted-foreground">
          Add a new building to your portfolio.
        </p>
      </div>

      <BuildingForm
        action={createAction}
        submitText="Create Building"
      />
    </div>
  );
}