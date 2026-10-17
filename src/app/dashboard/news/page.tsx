import { NewsView } from "@/features/dashboard/components/news-view";

export default function DashboardNews() {
  return <NewsView />;
}

// pages render behind a client-side auth/profile guard, so there is no static shell to validate
export const instant = false;
