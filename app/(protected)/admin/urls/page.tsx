import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/header";

import LiveLog from "../../dashboard/urls/live-logs";
import UserUrlsList from "../../dashboard/urls/url-list";

export const metadata = constructMetadata({
  title: "短链接 - apil.top",
  description: "列出并管理记录。",
});

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user?.id) redirect("/login");

  return (
    <>
      <DashboardHeader
        heading="管理&nbsp;短链接"
        text="列出并管理短链接。"
        link="/docs/short-urls"
        linkText="短链接。"
      />
      <UserUrlsList
        user={{
          id: user.id,
          name: user.name || "",
          apiKey: user.apiKey || "",
          role: user.role,
        }}
        action="/api/url/admin"
      />
      <LiveLog admin={true} />
    </>
  );
}
