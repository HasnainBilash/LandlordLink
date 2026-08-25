import { auth } from "@/auth";

import { UserNav } from "./user-nav";

export async function AppHeader() {
  const session = await auth();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-8">
      <h1 className="font-semibold">
        LandLordLink
      </h1>

      <UserNav
        name={session?.user?.name ?? "User"}
        role={session?.user?.role ?? ""}
      />
    </header>
  );
}