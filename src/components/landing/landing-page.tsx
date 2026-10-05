import {
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  KeyRound,
  Moon,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { DemoButtons } from "@/components/demo/demo-buttons";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ButtonLink } from "@/components/ui/button-link";

import { ProductPreview } from "./product-preview";

const FEATURES = [
  {
    icon: Building2,
    title: "Every building at a glance",
    text: "Floors and flats laid out like the real building, with who lives where and who's behind on rent.",
  },
  {
    icon: Wallet,
    title: "Rent that keeps itself",
    text: "Monthly rent appears on its own. Record full or partial payments in two taps — overdue months flag themselves.",
  },
  {
    icon: KeyRound,
    title: "Tenants join with a code",
    text: "Share a building's access code. Tenants request a flat, you approve, and the lease is created for you.",
  },
  {
    icon: Bell,
    title: "Notices that reach everyone",
    text: "Water off on Friday? Post it once and every tenant of the building sees it on their home screen.",
  },
  {
    icon: BarChart3,
    title: "Reports that answer questions",
    text: "Collected vs. due each month, occupancy by building, and past tenants who still owe you.",
  },
  {
    icon: Smartphone,
    title: "Made for your phone",
    text: "Everything works on a phone, so you can check a flat or record rent from anywhere.",
  },
];

const STEPS = [
  {
    title: "Add your building",
    text: "Quick setup creates every floor and flat in seconds — 301, 302, 303…",
  },
  {
    title: "Share the access code",
    text: "Tenants you've spoken to use it to request a flat from their phone.",
  },
  {
    title: "Approve and collect",
    text: "Approve with one tap, then record rent and bills as they come in.",
  },
];

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 md:px-8">
          <Logo />

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#tenants" className="transition-colors hover:text-foreground">For tenants</a>
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <ButtonLink href="/login" variant="ghost">
              Log in
            </ButtonLink>
            <ButtonLink href="/register" className="hidden sm:inline-flex">
              Get started
            </ButtonLink>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-brand-glow relative overflow-hidden">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 pt-16 pb-24 md:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
            <div className="space-y-7">
              <span className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs ring-1 ring-foreground/10 backdrop-blur">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Built for landlords in Bangladesh
              </span>

              <h1 className="text-4xl leading-[1.08] font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Rent, tenants and buildings —{" "}
                <span className="text-brand-gradient">all in one place.</span>
              </h1>

              <p className="max-w-xl text-lg text-pretty text-muted-foreground">
                LandlordLink keeps track of every flat, lease and taka of rent for
                you. Tenants request flats with an access code, rent bills itself
                each month, and you always know who owes what.
              </p>

              <div className="space-y-3">
                <DemoButtons />
                <p className="text-sm text-muted-foreground">
                  No sign-up needed · Demo data resets every night
                </p>
              </div>
            </div>

            <ProductPreview />
          </div>
        </section>

        {/* Highlights strip */}
        <section className="border-y bg-card/50">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-6 px-4 py-6 text-sm md:grid-cols-4 md:px-8">
            <Highlight icon={ReceiptText} text="Taka amounts, lakh grouping" />
            <Highlight icon={Smartphone} text="Works on any phone" />
            <Highlight icon={ShieldCheck} text="Tenants only see their own flat" />
            <Highlight icon={Moon} text="Light and dark mode" />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-24 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-primary">Everything you need</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Less chasing, fewer notebooks, no spreadsheets
            </h2>
            <p className="mt-4 text-muted-foreground">
              One place for the buildings you own, the people who live in them and
              the money that moves between you.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="group rounded-3xl bg-card p-6 shadow-xs ring-1 ring-foreground/[0.07] transition hover:-translate-y-1 hover:shadow-lg dark:ring-white/[0.08]"
              >
                <span className="bg-brand-gradient flex size-11 items-center justify-center rounded-2xl text-white shadow-md shadow-blue-600/25">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 border-y bg-card/50">
          <div className="mx-auto w-full max-w-6xl px-4 py-24 md:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold text-primary">How it works</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Up and running in an afternoon
              </h2>
            </div>

            <ol className="mt-14 grid gap-5 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="relative rounded-3xl bg-background p-6 ring-1 ring-foreground/[0.07]">
                  <span className="text-brand-gradient text-4xl font-bold tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* For tenants */}
        <section id="tenants" className="mx-auto grid w-full max-w-6xl scroll-mt-20 items-center gap-12 px-4 py-24 md:px-8 lg:grid-cols-2">
          <div className="space-y-5">
            <p className="text-sm font-semibold text-primary">For tenants</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Your home, your rent, your building&apos;s news
            </h2>
            <ul className="space-y-3 text-muted-foreground">
              {[
                "See exactly what you owe — rent and bills, month by month",
                "Get your building's notices the moment they're posted",
                "Find a flat and send a request with the landlord's access code",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-card p-6 shadow-xl shadow-blue-950/10 ring-1 ring-foreground/[0.07] dark:shadow-black/30">
            <p className="text-sm text-muted-foreground">Hi, Nusrat</p>
            <p className="mt-1 text-xl font-semibold">Flat 201 · Green Valley Apartments</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-muted/60 p-4">
                <p className="text-xs text-muted-foreground">Rent</p>
                <p className="text-lg font-semibold tabular-nums">৳19,500/mo</p>
              </div>
              <div className="rounded-2xl bg-red-500/10 p-4">
                <p className="text-xs text-red-700 dark:text-red-300">You owe</p>
                <p className="text-lg font-semibold text-red-700 tabular-nums dark:text-red-300">৳9,750</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border p-4">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Water tank cleaning this weekend</p>
                <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:text-sky-300">New</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Water may be off Saturday 9am–1pm.
              </p>
            </div>
          </div>
        </section>

        {/* Final call to action */}
        <section className="px-4 pb-24 md:px-8">
          <div className="bg-brand-glow mx-auto w-full max-w-6xl rounded-[2rem] bg-card px-6 py-16 text-center ring-1 ring-foreground/[0.07] dark:ring-white/[0.08]">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">See it with real-looking data</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Open the demo as a landlord with three buildings and 26 tenants,
              or as one of their tenants. Nothing to install.
            </p>
            <DemoButtons className="mt-8 justify-center" />
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row md:px-8">
          <Logo />
          <p>© {new Date().getFullYear()} LandlordLink · Made in Bangladesh</p>
          <div className="flex gap-4">
            <a href="/login" className="hover:text-foreground">Log in</a>
            <a href="/register" className="hover:text-foreground">Create account</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Highlight({ icon: Icon, text }: { icon: typeof Wallet; text: string }) {
  return (
    <div className="flex items-center gap-2.5 text-muted-foreground">
      <Icon className="size-4.5 shrink-0 text-primary" />
      <span>{text}</span>
    </div>
  );
}
