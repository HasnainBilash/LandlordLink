export type ComputedPaymentStatus =
  | "PENDING"
  | "PARTIAL"
  | "PAID"
  | "OVERDUE"
  | "WRITTEN_OFF";

// UtilityBill has no status column of its own — unlike Rent, its
// paid/unpaid state is always derived from the PaymentHistory rows
// recorded against it (and whether the landlord wrote it off).
export function computePaymentStatus({
  amount,
  paidTotal,
  dueDate,
  now,
  writtenOffAt = null,
}: {
  amount: number;
  paidTotal: number;
  dueDate: Date;
  now: Date;
  writtenOffAt?: Date | null;
}): ComputedPaymentStatus {
  if (paidTotal >= amount) {
    return "PAID";
  }

  if (writtenOffAt) {
    return "WRITTEN_OFF";
  }

  if (paidTotal > 0) {
    return "PARTIAL";
  }

  return dueDate < now ? "OVERDUE" : "PENDING";
}

// Sums a bill's payments.
export function sumPayments(payments: { amount: unknown }[]) {
  return payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
}

// What is still owed on a bill; 0 once it is paid or written off.
export function remainingBalance(bill: {
  amount: unknown;
  payments: { amount: unknown }[];
  status?: string;
  writtenOffAt?: Date | null;
}) {
  if (bill.status === "WRITTEN_OFF" || bill.writtenOffAt) return 0;

  return Math.max(Number(bill.amount) - sumPayments(bill.payments), 0);
}
