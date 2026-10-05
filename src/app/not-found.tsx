import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>

      <p className="text-muted-foreground">
        This page doesn&apos;t exist, or you don&apos;t have access to it.
      </p>

      <Link href="/" className={buttonVariants()}>
        Go home
      </Link>
    </div>
  );
}
