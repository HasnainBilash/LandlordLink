import { redirect } from "next/navigation";

import { auth } from "@/auth";

import { LandingPage } from "@/components/landing/landing-page";

// Public landing page; signed-in users go straight to their home.
export default async function HomePage() {
  const session = await auth();

  if (session?.user?.role === "LANDLORD") redirect("/dashboard");
  if (session?.user?.role === "TENANT") redirect("/tenant");

  return <LandingPage />;
}
