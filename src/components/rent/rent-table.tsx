import { Badge } from "@/components/ui/badge";
import { MarkRentPaidButton } from "./mark-rent-paid-button";
import { MONTH_NAMES } from "@/lib/rent";

const statusVariant = {
  PENDING: "outline",
  PARTIAL: "secondary",
  PAID: "default",
  OVERDUE: "destructive",
} as const;

type RentTableProps = {
  rents: {
    id: string;
    month: number;
    year: number;
    amount: number | string;
    dueDate: Date;
    status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";
  }[];
  canManage?: boolean;
};

export function RentTable({ rents, canManage = false }: RentTableProps) {
  if (rents.length === 0) {
    return <p className="text-muted-foreground">No rent periods yet.</p>;
  }

  return (
    <div className="space-y-3">
      {rents.map((rent) => (
        <div
          key={rent.id}
          className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
        >
          <div>
            <p className="font-semibold">
              {MONTH_NAMES[rent.month - 1]} {rent.year}
            </p>

            <p className="text-sm text-muted-foreground">
              ${Number(rent.amount).toFixed(2)} · Due{" "}
              {new Date(rent.dueDate).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant={statusVariant[rent.status]}>{rent.status}</Badge>

            {canManage && rent.status !== "PAID" && (
              <MarkRentPaidButton rentId={rent.id} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
