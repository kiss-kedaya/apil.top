import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/header";

import UsersList from "./user-list";

export const metadata = constructMetadata({
  title: "用户管理 – qali.cn",
  description: "列出并管理所有用户。",
});

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user || !user?.id) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  return (
    <>
      <DashboardHeader
        heading="用户管理"
        text="列出并管理所有用户。"
      />
      <UsersList user={{ id: user.id, name: user.name || "" }} />
    </>
  );
}
