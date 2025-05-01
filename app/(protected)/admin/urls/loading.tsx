import { Skeleton } from "@/components/ui/skeleton";
import { DashboardHeader } from "@/components/dashboard/header";

export default function DashboardUrlsLoading() {
  return (
    <>
      <DashboardHeader heading="短链接" text="" />
      <Skeleton className="h-full w-full rounded-lg" />
    </>
  );
}
