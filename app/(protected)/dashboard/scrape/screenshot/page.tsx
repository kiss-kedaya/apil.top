import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/header";

import DashboardScrapeCharts from "../charts";
import { ScreenshotScraping } from "../scrapes";

export const metadata = constructMetadata({
  title: "网址转截图API - apil.top",
  description:
    "快速提取网站截图。免费且无限制使用！",
});

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user?.id) redirect("/login");

  return (
    <>
      <DashboardHeader
        heading="网址转截图"
        text="快速提取网站截图。免费且无限制使用！"
        link="/docs/open-api/screenshot"
        linkText="截图API。"
      />
      <ScreenshotScraping user={{ id: user.id, apiKey: user.apiKey }} />
    </>
  );
}
