import { Placeholder } from "@/features/dashboard/components/placeholder";

export default function DashboardAdvisory() {
  return <Placeholder />;
}

// pages render behind a client-side auth/profile guard, so there is no static shell to validate
export const instant = false;
