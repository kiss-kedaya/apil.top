import { Skeleton } from "@/components/ui/skeleton";
import { DashboardHeader } from "@/components/dashboard/header";

export default function OrdersLoading() {
  return (
    <>
      <DashboardHeader
        heading="用户管理"
        text="列出并管理所有用户。"
      />
      <Skeleton className="h-full w-full rounded-lg" />
    </>
  );
}
