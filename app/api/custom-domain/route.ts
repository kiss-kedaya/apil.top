import { env } from "@/env.mjs";
import { TeamPlanQuota } from "@/config/team";
import {
  createUserCustomDomain,
  getUserCustomDomainById,
  getUserCustomDomains,
  getVerifiedUserCustomDomains,
  deleteUserCustomDomain,
  updateUserCustomDomain,
  verifyUserCustomDomain,
} from "@/lib/dto/custom-domain";
import { checkUserStatus } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";
import { z } from "zod";
import { NextResponse } from "next/server";
import { auth } from "auth";

// 获取用户自定义域名列表
export async function GET(req: Request) {
  const url = new URL(req.url);
  const verified = url.searchParams.get("verified");
  const id = url.searchParams.get("id");
  
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        {
          status: 401,
        }
      );
    }

    const userId = session.user.id;

    if (id) {
      // 获取单个自定义域名详情
      const result = await getUserCustomDomainById(userId, id);
      return NextResponse.json(result);
    } else if (verified === "true") {
      // 获取所有已验证的自定义域名
      const result = await getVerifiedUserCustomDomains(userId);
      return NextResponse.json(result);
    } else {
      // 获取所有自定义域名
      const result = await getUserCustomDomains(userId);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("Error getting custom domains:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 创建新的自定义域名
export async function POST(req: Request) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;

    // 检查用户权限和配额
    if (user.role !== "ADMIN") {
      const { data } = await getUserCustomDomains(user.id);
      if (data && Array.isArray(data) && data.length >= TeamPlanQuota[user.team || "free"].customDomains) {
        return Response.json(
          { status: "error", message: "您已达到自定义域名的最大限制" },
          { status: 403 }
        );
      }
    }

    const data = await req.json();
    const result = await createUserCustomDomain(user.id, data);

    if (result.status === "error") {
      return Response.json(result, { status: 400 });
    }

    return Response.json(result);
  } catch (error) {
    console.error("创建自定义域名错误:", error);
    return Response.json(
      { status: "error", message: "创建自定义域名失败" },
      { status: 500 }
    );
  }
} 