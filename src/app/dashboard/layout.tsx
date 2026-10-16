import type { Metadata } from "next";
import { DashboardShell } from "@/features/dashboard/components/shell";

export const metadata: Metadata = { title: "Finpass | Dashboard" };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
