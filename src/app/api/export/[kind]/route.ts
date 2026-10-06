import { auth } from "@/auth";
import { EXPORTS, type ExportKind } from "@/lib/exports";
import { toDateInputValue } from "@/lib/format";

// CSV downloads from Reports: /api/export/rent-roll, /payments, /owed.
// Landlords only, and only their own data.
export async function GET(_request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Please sign in." }, { status: 401 });
  }

  if (session.user.role !== "LANDLORD") {
    return Response.json({ error: "Only landlords can download reports." }, { status: 403 });
  }

  const { kind } = await params;

  if (!Object.hasOwn(EXPORTS, kind)) {
    return Response.json({ error: "No such download." }, { status: 404 });
  }

  const csv = await EXPORTS[kind as ExportKind](session.user.id);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="landlordlink-${kind}-${toDateInputValue(new Date())}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
