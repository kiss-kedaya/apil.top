import { Skeleton } from "@/components/ui/skeleton";
import { DashboardHeader } from "@/components/dashboard/header";

export default function DashboardRecordsLoading() {
  return (
    <>
      <DashboardHeader heading="DNS记录" text="" />
      <Skeleton className="h-full w-full rounded-lg" />
    </>
  );
}
