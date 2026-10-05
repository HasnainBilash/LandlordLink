"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-bold">Something went wrong</h1>

      <p className="text-muted-foreground">
        An unexpected error occurred. Please try again.
      </p>

      {error.digest && (
        <p className="font-mono text-xs text-muted-foreground">
          Error ID: {error.digest}
        </p>
      )}

      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
