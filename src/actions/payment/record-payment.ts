"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { recordPaymentSchema } from "@/lib/validations/payment";

import { ActionResult } from "@/types/action-result";

type PaymentTarget =
  | { type: "RENT"; id: string }
  | { type: "UTILITY_BILL"; id: string };

export async function recordPayment(
  target: PaymentTarget,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "LANDLORD") {
    return {
      success: false,
      message: "Unauthorized.",
      errors: {},
    };
  }

  const ownershipFilter = {
    lease: {
      flat: {
        floor: {
          building: {
            ownerId: session.user.id,
          },
        },
      },
    },
  };

  const bill =
    target.type === "RENT"
      ? await prisma.rent.findFirst({
          where: { id: target.id, ...ownershipFilter },
          include: { payments: true, lease: { include: { flat: { include: { floor: true } } } } },
        })
      : await prisma.utilityBill.findFirst({
          where: { id: target.id, ...ownershipFilter },
          include: { payments: true, lease: { include: { flat: { include: { floor: true } } } } },
        });

  if (!bill) {
    return {
      success: false,
      message: "Record not found.",
      errors: {},
    };
  }

  const values = {
    amount: formData.get("amount"),
    transactionRef: formData.get("transactionRef"),
  };

  const parsed = recordPaymentSchema.safeParse(values);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      success: false,
      message: Object.values(fieldErrors).flat()[0] ?? "Validation failed.",
      errors: fieldErrors,
    };
  }

  const paidSoFar = bill.payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );

  const remaining = Number(bill.amount) - paidSoFar;

  if (parsed.data.amount > remaining + 0.001) {
    return {
      success: false,
      message: `Payment amount exceeds the remaining balance of $${remaining.toFixed(2)}.`,
      errors: {
        amount: [`Cannot exceed the remaining balance of $${remaining.toFixed(2)}.`],
      },
    };
  }

  await prisma.paymentHistory.create({
    data: {
      paymentType: target.type === "RENT" ? "RENT" : "UTILITY",
      rentId: target.type === "RENT" ? target.id : null,
      utilityBillId: target.type === "UTILITY_BILL" ? target.id : null,
      amount: parsed.data.amount,
      transactionRef: parsed.data.transactionRef || null,
    },
  });

  if (target.type === "RENT") {
    const newPaidTotal = paidSoFar + parsed.data.amount;

    await prisma.rent.update({
      where: { id: target.id },
      data: {
        status: newPaidTotal >= Number(bill.amount) ? "PAID" : "PARTIAL",
      },
    });
  }

  revalidatePath(
    `/dashboard/buildings/${bill.lease.flat.floor.buildingId}/floors/${bill.lease.flat.floorId}/flats/${bill.lease.flatId}`
  );

  return {
    success: true,
    message: "Payment recorded.",
    errors: {},
  };
}
