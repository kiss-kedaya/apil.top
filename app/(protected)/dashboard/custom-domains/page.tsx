import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/header";
import CustomDomainsList from "@/app/(protected)/dashboard/custom-domains/domain-list";

export const metadata = constructMetadata({
  title: "自定义域名 - kedaya.xyz",
  description: "管理您的自定义域名。",
});

export default async function CustomDomainsPage() {
  const user = await getCurrentUser();

  if (!user?.id) redirect("/login");

  return (
    <>
      <DashboardHeader
        heading="管理自定义域名"
        text="添加和管理您的自定义域名。"
        link="/docs/custom-domains"
        linkText="了解更多关于自定义域名的信息。"
      />
      <CustomDomainsList
        user={{
          id: user.id,
          name: user.name || "",
          role: user.role,
          team: user.team || "free",
        }}
        action="/api/custom-domain"
      />
    </>
  );
}
