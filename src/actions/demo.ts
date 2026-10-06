"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";
import { DEMO_LANDLORD, DEMO_PASSWORD, DEMO_TENANT } from "@/lib/demo";

import { ActionResult } from "@/types/action-result";

// "Try the demo": signs the visitor in to the shared demo landlord or
// demo tenant. Only these two accounts can be reached this way, whatever
// the client sends.
export async function startDemo(role: string): Promise<ActionResult> {
  const isTenant = role === "tenant";
  const account = isTenant ? DEMO_TENANT : DEMO_LANDLORD;

  try {
    await signIn("credentials", {
      email: account.email,
      password: DEMO_PASSWORD,
      redirectTo: isTenant ? "/tenant" : "/dashboard",
    });
  } catch (error) {
    // A successful sign-in throws Next's redirect, which must propagate.
    if (error instanceof AuthError) {
      const rateLimited = "code" in error && error.code === "rate_limited";

      return {
        success: false,
        message: rateLimited
          ? "Too many sign-ins from your network. Please wait a few minutes and try again."
          : "The demo isn't available right now. Please try again in a moment.",
        errors: {},
      };
    }

    throw error;
  }

  return { success: true, message: "", errors: {} };
}
