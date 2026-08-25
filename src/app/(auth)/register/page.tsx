import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Create Account"
      description="Join LandLordLink"
    >
      <AuthCard>
        <RegisterForm />
      </AuthCard>
    </AuthLayout>
  );
}