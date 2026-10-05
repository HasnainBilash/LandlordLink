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
      title="Welcome Back"
      description="Sign in to your account"
    >
      <AuthCard>
        <LoginForm callbackUrl={callbackUrl} />
      </AuthCard>
    </AuthLayout>
  );
}
