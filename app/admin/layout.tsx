import React from "react";
import { auth } from "auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "管理员控制台",
  description: "仅供管理员使用",
};

async function isAdmin(userId: string) {
  try {
    const result: any[] = await prisma.$queryRaw`
      SELECT role FROM users WHERE id = ${userId} LIMIT 1
    `;
    
    if (result && result.length > 0) {
      return result[0]?.role === "ADMIN";
    }
    return false;
  } catch {
    return false;
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  
  // 验证管理员权限
  const admin = await isAdmin(session.user.id);
  if (!admin) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-col">
        <div className="border-b">
          <div className="container flex h-16 items-center px-4">
            <h1 className="text-lg font-bold">管理员控制台</h1>
          </div>
        </div>
      </div>
      <div className="container flex-1 px-4 py-6">{children}</div>
    </div>
  );
} 