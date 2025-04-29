import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/header";

import { QrCodeScraping } from "../scrapes";

export const metadata = constructMetadata({
  title: "Url to QR Code API - WR.DO",
  description: "Generate QR Code from URL",
});

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user?.id) redirect("/login");

  return (
    <>
      <DashboardHeader
        heading="Url&nbsp;&nbsp;to&nbsp;&nbsp;QR&nbsp;&nbsp;Code"
        text="Generate QR Code from URL"
        link="/docs/open-api/qrcode"
        linkText="QR Code API."
      />
      <QrCodeScraping user={{ id: user.id, apiKey: user.apiKey }} />
    </>
  );
}
