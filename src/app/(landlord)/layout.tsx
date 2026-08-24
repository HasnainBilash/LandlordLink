import { ReactNode } from "react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";

type LandlordLayoutProps = {
  children: ReactNode;
};

export default function LandlordLayout({ children }: LandlordLayoutProps) {
  return <DashboardLayout>{children}</DashboardLayout>;
}