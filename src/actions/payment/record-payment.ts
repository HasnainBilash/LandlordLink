"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { recordPaymentSchema } from "@/lib/validations/payment";
import { formatMoney } from "@/lib/format";
import { logActivity } from "@/lib/log-activity";
import { revalidateApp } from "@/lib/revalidate";

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

  const ownerId = session.user.id;
  const amount = parsed.data.amount;

  const ownershipFilter = {
    lease: {
      flat: {
        floor: {
          building: {
            ownerId,
          },
        },
      },
    },
  };

  // The balance check and the insert run in one transaction with the
  // bill row locked, so two quick submissions can't both pass the
  // "remaining balance" check and overpay.
  const result = await prisma.$transaction(async (tx) => {
    if (target.type === "RENT") {
      await tx.$queryRaw`SELECT "id" FROM "Rent" WHERE "id" = ${target.id} FOR UPDATE`;
    } else {
      await tx.$queryRaw`SELECT "id" FROM "UtilityBill" WHERE "id" = ${target.id} FOR UPDATE`;
    }

    const bill =
      target.type === "RENT"
        ? await tx.rent.findFirst({
            where: { id: target.id, ...ownershipFilter },
            include: { payments: true, lease: { include: { flat: { include: { floor: true } } } } },
          })
        : await tx.utilityBill.findFirst({
            where: { id: target.id, ...ownershipFilter },
            include: { payments: true, lease: { include: { flat: { include: { floor: true } } } } },
          });

    if (!bill) {
      return { kind: "not-found" } as const;
    }

    const isWrittenOff =
      ("status" in bill && bill.status === "WRITTEN_OFF") ||
      ("writtenOffAt" in bill && bill.writtenOffAt !== null);

    if (isWrittenOff) {
      return { kind: "written-off" } as const;
    }

    const paidSoFar = bill.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    const remaining = Number(bill.amount) - paidSoFar;

    if (amount > remaining + 0.001) {
      return { kind: "exceeds", remaining } as const;
    }

    // Safety net against repeat submissions: the same amount on the same
    // bill a few seconds apart is almost certainly an accidental resubmit.
    const duplicateWindowStart = new Date(Date.now() - 15_000);
    const isDuplicate = bill.payments.some(
      (payment) =>
        Number(payment.amount) === amount &&
        payment.createdAt > duplicateWindowStart
    );

    if (isDuplicate) {
      return { kind: "duplicate" } as const;
    }

    const payment = await tx.paymentHistory.create({
      data: {
        paymentType: target.type === "RENT" ? "RENT" : "UTILITY",
        rentId: target.type === "RENT" ? target.id : null,
        utilityBillId: target.type === "UTILITY_BILL" ? target.id : null,
        amount,
        transactionRef: parsed.data.transactionRef || null,
      },
    });

    if (target.type === "RENT") {
      await tx.rent.update({
        where: { id: target.id },
        data: {
          status: paidSoFar + amount >= Number(bill.amount) ? "PAID" : "PARTIAL",
        },
      });
    }

    return { kind: "ok", bill, payment } as const;
  });

  if (result.kind === "not-found") {
    return {
      success: false,
      message: "Record not found.",
      errors: {},
    };
  }

  if (result.kind === "written-off") {
    return {
      success: false,
      message: "This bill was written off, so payments can no longer be recorded on it.",
      errors: {},
    };
  }

  if (result.kind === "duplicate") {
    return {
      success: false,
      message:
        "This payment was just recorded. Wait a few seconds if you really want to record the same amount again.",
      errors: {},
    };
  }

  if (result.kind === "exceeds") {
    const remaining = formatMoney(result.remaining);

    return {
      success: false,
      message: `Payment amount exceeds the remaining balance of ${remaining}.`,
      errors: {
        amount: [`Cannot exceed the remaining balance of ${remaining}.`],
      },
    };
  }

  const { bill, payment } = result;

  await logActivity({
    userId: ownerId,
    action: "PAY",
    entity: target.type === "RENT" ? "Rent" : "UtilityBill",
    entityId: target.id,
    buildingId: bill.lease.flat.floor.buildingId,
    description: `Recorded payment of ${formatMoney(amount)} (${payment.id}).`,
  });

  revalidateApp();

  return {
    success: true,
    message: `Payment of ${formatMoney(amount)} recorded.`,
    errors: {},
  };
}
