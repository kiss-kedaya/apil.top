import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { ScrapeInfoCard } from "@/components/dashboard/dashboard-info-card";
import { DashboardHeader } from "@/components/dashboard/header";

import DashboardScrapeCharts from "./charts";

export const metadata = constructMetadata({
  title: "抓取API - qali.cn",
  description: "快速提取有价值的结构化网站数据",
});

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user?.id) redirect("/login");

  return (
    <>
      <DashboardHeader
        heading="抓取API概览"
        text="快速提取有价值的结构化网站数据。免费且无限制使用！"
        link="/docs/open-api"
        linkText="开放API。"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ScrapeInfoCard
          userId={user.id}
          title="网址转截图"
          desc="网页截图。"
          link="/dashboard/scrape/screenshot"
          icon="camera"
        />
        <ScrapeInfoCard
          userId={user.id}
          title="网址转元信息"
          desc="提取网站元数据。"
          link="/dashboard/scrape/meta-info"
          icon="globe"
        />
        <ScrapeInfoCard
          userId={user.id}
          title="网址转二维码"
          desc="从URL生成二维码。"
          link="/dashboard/scrape/qrcode"
          icon="qrcode"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ScrapeInfoCard
          userId={user.id}
          title="网址转Markdown"
          desc="将网站内容转换为Markdown格式。"
          link="/dashboard/scrape/markdown"
          icon="heading1"
        />
        <ScrapeInfoCard
          userId={user.id}
          title="网址转文本"
          desc="提取网站文本。"
          link="/dashboard/scrape/markdown"
          icon="fileText"
        />
      </div>
      <DashboardScrapeCharts id={user.id} />
    </>
  );
}
