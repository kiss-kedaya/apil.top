import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/header";

import { QrCodeScraping, QrCodeDecoding } from "../scrapes";

export const metadata = constructMetadata({
  title: "二维码API - qali.cn",
  description: "从URL生成二维码，或从图片解析二维码",
});

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user?.id) redirect("/login");

  return (
    <>
      <DashboardHeader
        heading="二维码API"
        text="从URL生成二维码，或从图片解析二维码"
        link="/docs/open-api/qrcode"
        linkText="二维码API。"
      />
      <div className="grid gap-8">
        <QrCodeScraping user={{ id: user.id, apiKey: user.apiKey }} />
        <QrCodeDecoding user={{ id: user.id, apiKey: user.apiKey }} />
      </div>
    </>
  );
}
