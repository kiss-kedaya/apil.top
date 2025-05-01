import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/header";

import UsersList from "./user-list";

export const metadata = constructMetadata({
  title: "用户管理 – apil.top",
  description: "查看所有用户列表和信息",
});

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user || !user?.id) redirect("/login");

  return (
    <>
      <DashboardHeader
        heading="用户管理"
        text="查看所有用户列表和信息"
      />
      <UsersList user={{ id: user.id, name: user.name || "" }} />
    </>
  );
}
