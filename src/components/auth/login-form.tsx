"use client";

import Link from "next/link";
import { useActionState } from "react";

import { loginUser, type LoginState } from "@/actions/login";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: LoginState = {
  success: false,
};

export function LoginForm() {
  const [state, action] = useActionState(loginUser, initialState);

  return (
    <form action={action} className="space-y-5">
      {state.errors?.general && (
        <p className="text-sm text-red-500">
          {state.errors.general[0]}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>

        <Input
          id="email"
          name="email"
          type="email"
          placeholder="john@example.com"
          required
        />

        {state.errors?.email && (
          <p className="text-sm text-red-500">
            {state.errors.email[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>

        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
        />
      </div>

      <Button type="submit" className="w-full">
        Sign In
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-primary hover:underline"
        >
          Register
        </Link>
      </p>
    </form>
  );
}