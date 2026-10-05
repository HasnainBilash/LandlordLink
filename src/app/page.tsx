import { redirect } from "next/navigation";

import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  switch (session.user.role) {
    case "LANDLORD":
      redirect("/dashboard");

    case "TENANT":
      redirect("/tenant");

    default:
      redirect("/login");
  }
}