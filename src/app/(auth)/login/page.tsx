import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl } = await searchParams;

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to manage your buildings or your home."
      showDemo
    >
      <AuthCard>
        <LoginForm callbackUrl={callbackUrl} />
      </AuthCard>
    </AuthLayout>
  );
}
