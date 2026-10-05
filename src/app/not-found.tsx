import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button-link";

// Shown on its own (unknown URLs) and inside the app shell (e.g. a flat
// that no longer exists), so it sizes itself to the content area.
export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <Logo />

      <div className="relative">
        <div aria-hidden className="absolute inset-0 -z-10 rounded-full bg-primary/15 blur-3xl" />
        <p className="text-brand-gradient text-7xl font-bold tracking-tight sm:text-8xl">404</p>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
        <p className="max-w-md text-balance text-muted-foreground">
          This page doesn&apos;t exist, or you don&apos;t have access to it.
        </p>
      </div>

      <ButtonLink href="/" size="lg">
        Go home
      </ButtonLink>
    </div>
  );
}
