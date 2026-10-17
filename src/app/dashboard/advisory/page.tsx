import { Suspense } from "react";
import { AdvisoryView } from "@/features/dashboard/components/advisory-view";

export default function DashboardAdvisory() {
  return (
    <Suspense>
      <AdvisoryView />
    </Suspense>
  );
}

// pages render behind a client-side auth/profile guard, so there is no static shell to validate
export const instant = false;
