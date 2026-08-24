"use server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { logActivity } from "@/lib/log-activity";

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

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email: parsed.data.email,
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