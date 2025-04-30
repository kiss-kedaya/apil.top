import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/header";

import DashboardScrapeCharts from "../charts";
import { MetaScraping } from "../scrapes";

export const metadata = constructMetadata({
  title: "网址转元信息API - kedaya.xyz",
  description: "快速提取有价值的结构化网站数据",
});

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user?.id) redirect("/login");

  return (
    <>
      <DashboardHeader
        heading="网址转元信息"
        text="快速提取有价值的结构化网站数据。免费且无限制使用！"
        link="/docs/open-api/meta-info"
        linkText="元信息API。"
      />
      <MetaScraping user={{ id: user.id, apiKey: user.apiKey }} />
    </>
  );
}
