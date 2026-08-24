"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";

export type LoginState = {
  success: boolean;
  errors?: {
    email?: string[];
    general?: string[];
  };
};

export async function loginUser(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            success: false,
            errors: {
              email: ["Invalid email or password."],
            },
          };

        default:
          return {
            success: false,
            errors: {
              general: ["Something went wrong."],
            },
          };
      }
    }

    throw error;
  }
}