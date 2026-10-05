import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Create your account"
      description="Free to use. Set up your first building in minutes."
      showDemo
    >
      <AuthCard>
        <RegisterForm />
      </AuthCard>
    </AuthLayout>
  );
}