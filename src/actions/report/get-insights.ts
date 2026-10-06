"use server";

import { auth } from "@/auth";
import { loadInsights } from "@/lib/insights-data";

// Reports → Insights for the signed-in landlord.
export async function getInsights() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "LANDLORD") {
    return null;
  }

  return loadInsights(session.user.id);
}
