import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
}

export function AuthLayout({
  children,
  title,
  description,
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* Left */}

      <section className="hidden lg:flex flex-col justify-center bg-primary text-primary-foreground p-16">
        <h1 className="text-5xl font-bold mb-6">
          LandLordLink
        </h1>

        <p className="text-lg opacity-90 max-w-md">
          Manage buildings, tenants, leases and rent payments from one modern dashboard.
        </p>
      </section>

      {/* Right */}

      <section className="flex items-center justify-center p-8 bg-muted/30">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold">{title}</h2>

            <p className="text-muted-foreground mt-2">
              {description}
            </p>
          </div>

          {children}
        </div>
      </section>
    </main>
  );
}