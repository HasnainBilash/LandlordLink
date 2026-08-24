export type ComputedPaymentStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";

// UtilityBill has no status column of its own — unlike Rent, its
// paid/unpaid state is always derived from the PaymentHistory rows
// recorded against it.
export function computePaymentStatus({
  amount,
  paidTotal,
  dueDate,
  now,
}: {
  amount: number;
  paidTotal: number;
  dueDate: Date;
  now: Date;
}): ComputedPaymentStatus {
  if (paidTotal >= amount) {
    return "PAID";
  }

  if (paidTotal > 0) {
    return "PARTIAL";
  }

  return dueDate < now ? "OVERDUE" : "PENDING";
}
