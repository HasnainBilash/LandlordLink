"use server";

import { AuthError } from "next-auth";

import { signIn, TooManySignInAttempts } from "@/auth";

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
  // Only accept in-app paths ("/x", not "//evil.com") as a return target.
  const callbackUrl = formData.get("callbackUrl");
  const redirectTo =
    typeof callbackUrl === "string" && /^\/(?!\/)/.test(callbackUrl)
      ? callbackUrl
      : "/";

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      if (error instanceof TooManySignInAttempts || ("code" in error && error.code === "rate_limited")) {
        return {
          success: false,
          errors: {
            general: ["Too many sign-in attempts. Please wait 15 minutes and try again."],
          },
        };
      }

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