import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  const user = await getCurrentUser();

  // 用户已登录，直接重定向到仪表盘
  if (user) {
    redirect("/dashboard");
  }

  return <div className="min-h-screen">{children}</div>;
}
