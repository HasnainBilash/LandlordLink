import { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { DemoButtons } from "@/components/demo/demo-buttons";
import { ThemeToggle } from "@/components/theme/theme-toggle";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
  // Offer the one-click demo under the form.
  showDemo?: boolean;
}

const POINTS = [
  "Every building, floor and flat in one view",
  "Rent that bills itself every month",
  "Tenants request flats with an access code",
  "Works beautifully on your phone",
];

export function AuthLayout({
  children,
  title,
  description,
  showDemo = false,
}: AuthLayoutProps) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      {/* Brand panel */}
      <section className="bg-brand-gradient relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-sky-400/20 blur-3xl" />

        <Logo inverted className="relative text-white" />

        <div className="relative my-auto max-w-md space-y-8">
          <h1 className="text-4xl leading-tight font-bold tracking-tight">
            The calm way to run your rental buildings.
          </h1>
          <ul className="space-y-3 text-white/85">
            {POINTS.map((point) => (
              <li key={point} className="flex items-center gap-3">
                <CheckCircle2 className="size-5 shrink-0 text-emerald-300" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/70">
          Made for landlords and tenants in Bangladesh.
        </p>
      </section>

      {/* Form */}
      <section className="bg-brand-glow flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <div className="lg:invisible">
            <Logo />
          </div>
          <ThemeToggle />
        </div>

        <div className="mx-auto my-auto w-full max-w-md py-10">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
            <p className="mt-2 text-muted-foreground">{description}</p>
          </div>

          {children}

          {showDemo && (
            <div className="mt-8">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or explore without an account
                <span className="h-px flex-1 bg-border" />
              </div>
              <DemoButtons variant="compact" className="mt-4 [&>button]:flex-1" />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
