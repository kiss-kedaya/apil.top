import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/header";

import { MarkdownScraping, TextScraping } from "../scrapes";

export const metadata = constructMetadata({
  title: "网址转Markdown API - qali.cn",
  description:
    "快速提取网站内容并转换为Markdown格式",
});

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user?.id) redirect("/login");

  return (
    <>
      <DashboardHeader
        heading="网址转Markdown"
        text="快速提取网站内容并转换为Markdown格式。免费且无限制使用！"
        link="/docs/open-api/markdown"
        linkText="Markdown API。"
      />
      <MarkdownScraping user={{ id: user.id, apiKey: user.apiKey }} />
      <TextScraping user={{ id: user.id, apiKey: user.apiKey }} />
    </>
  );
}
