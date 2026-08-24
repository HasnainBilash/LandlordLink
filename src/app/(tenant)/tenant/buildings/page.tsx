import Link from "next/link";

import { searchBuildingsWithVacantFlats } from "@/actions/join-request/search-buildings-with-vacant-flats";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type PageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function SearchBuildingsPage({
  searchParams,
}: PageProps) {
  const { q } = await searchParams;

  const buildings = await searchBuildingsWithVacantFlats(q);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Find a Flat</h1>

        <p className="text-muted-foreground">
          Search for a building by name, then see its available flats.
        </p>
      </div>

      <form className="flex gap-3">
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by building name..."
        />

        <Button type="submit">Search</Button>
      </form>

      {buildings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {q
              ? "No buildings match that search."
              : "No buildings currently have vacant flats."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {buildings.map((building) => (
            <Link
              key={building.id}
              href={`/tenant/buildings/${building.id}/flats`}
            >
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle>{building.name}</CardTitle>
                </CardHeader>

                <CardContent className="text-sm text-muted-foreground">
                  {building.address}, {building.city}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
