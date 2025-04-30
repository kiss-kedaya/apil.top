import { DashboardHeader } from "@/components/dashboard/header";
import { SkeletonSection } from "@/components/shared/section-skeleton";

export default function DashboardSettingsLoading() {
  return (
    <>
      <DashboardHeader
        heading="设置"
        text="管理账户和网站设置。"
      />
      <div className="divide-y divide-muted pb-10">
        <SkeletonSection />
        <SkeletonSection />
        <SkeletonSection card />
      </div>
    </>
  );
}
