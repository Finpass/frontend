import { Suspense } from "react";
import { CompareView } from "@/features/dashboard/components/compare-view";

export default function DashboardCompare() {
  return (
    <Suspense>
      <CompareView />
    </Suspense>
  );
}

// pages render behind a client-side auth/profile guard, so there is no static shell to validate
export const instant = false;
