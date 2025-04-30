import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/header";

import { QrCodeScraping } from "../scrapes";

export const metadata = constructMetadata({
  title: "网址转二维码API - apil.top",
  description: "从URL生成二维码",
});

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user?.id) redirect("/login");

  return (
    <>
      <DashboardHeader
        heading="网址转二维码"
        text="从URL生成二维码"
        link="/docs/open-api/qrcode"
        linkText="二维码API。"
      />
      <QrCodeScraping user={{ id: user.id, apiKey: user.apiKey }} />
    </>
  );
}
