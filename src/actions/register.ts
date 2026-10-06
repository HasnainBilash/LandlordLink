"use server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { logActivity } from "@/lib/log-activity";
import { clientIp, rateLimit, waitText } from "@/lib/rate-limit";

// New accounts per IP per hour.
const SIGN_UPS_PER_HOUR = 5;

export type RegisterState = {
  success: boolean;
  message?: string;

  values?: {
  name: string;
  email: string;
  role: "LANDLORD" | "TENANT";
  };
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
    role?: string[];
    general?: string[];
  };
};

export async function registerUser(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    role: String(formData.get("role") ?? ""),
  };

  const parsed = registerSchema.safeParse(values);

  if (!parsed.success) {
    return {
    success: false,
    values: {
    name: values.name,
    email: values.email,
    role: values.role as "LANDLORD" | "TENANT",
  },
    errors: parsed.error.flatten().fieldErrors,
  };
  }

  const limit = await rateLimit(`sign-up:${await clientIp()}`, SIGN_UPS_PER_HOUR, 60 * 60);

  if (!limit.allowed) {
    return {
      success: false,
      values: {
        name: values.name,
        email: values.email,
        role: values.role as "LANDLORD" | "TENANT",
      },
      errors: {
        general: [`Too many new accounts from your network. Please try again in ${waitText(limit.retryAfterSeconds)}.`],
      },
    };
  }

  try {
    // Also catches accounts registered before emails were lowercased.
    const existingUser = await prisma.user.findFirst({
      where: {
        email: { equals: parsed.data.email, mode: "insensitive" },
      },
    });

    if (existingUser) {
      return {
        success: false,
        values: {
          name: values.name,
          email: values.email,
          role: values.role as "LANDLORD" | "TENANT",
        },
        errors: {
          email: ["An account with this email already exists."],
        },
      };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const newUser = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role,
        // Tenants get an (empty, optional) profile right away so they can
        // request flats without an extra "complete your profile" step.
        ...(parsed.data.role === "TENANT"
          ? { tenantProfile: { create: {} } }
          : {}),
      },
    });

    await logActivity({
      userId: newUser.id,
      action: "REGISTER",
      entity: "User",
      entityId: newUser.id,
      description: `Registered as ${parsed.data.role}.`,
    });

    return {
      success: true,
      message: "Account created successfully.",
    };
  } catch (error) {
    console.error(error);

    return {
    success: false,
    values: {
      name: values.name,
      email: values.email,
      role: values.role as "LANDLORD" | "TENANT",
    },
    errors: {
      general: ["Something went wrong. Please try again."],
    },
    };
  }
}