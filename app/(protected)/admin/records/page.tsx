import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/header";

import UserRecordsList from "../../dashboard/records/record-list";

export const metadata = constructMetadata({
  title: "DNS记录 - qali.cn",
  description: "列出并管理记录。",
});

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user?.id) redirect("/login");

  return (
    <>
      <DashboardHeader
        heading="管理&nbsp;&nbsp;DNS&nbsp;&nbsp;记录"
        text="列出并管理记录。"
        link="/docs/dns-records"
        linkText="DNS记录。"
      />
      <UserRecordsList
        user={{ id: user.id, name: user.name || "", apiKey: user.apiKey || "" }}
        action="/api/record/admin"
      />
    </>
  );
}
