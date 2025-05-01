import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { DeleteAccountSection } from "@/components/dashboard/delete-account";
import { DashboardHeader } from "@/components/dashboard/header";
import { UserApiKeyForm } from "@/components/forms/user-api-key-form";
import { UserNameForm } from "@/components/forms/user-name-form";
import { UserRoleForm } from "@/components/forms/user-role-form";

export const metadata = constructMetadata({
  title: "设置 – apil.top",
  description: "配置您的账户和网站设置。",
});

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user?.id) redirect("/login");

  return (
    <>
      <DashboardHeader
        heading="账户设置"
        text="管理账户和网站设置。"
      />
      <div className="divide-y divide-muted pb-10">
        <UserNameForm user={{ id: user.id, name: user.name || "" }} />
        {user.role === "ADMIN" && (
          <UserRoleForm user={{ id: user.id, role: user.role }} />
        )}
        <UserApiKeyForm
          user={{
            id: user.id,
            name: user.name || "",
            apiKey: user.apiKey || "",
          }}
        />
        <DeleteAccountSection />
      </div>
    </>
  );
}
