import { env } from "@/env.mjs";
import { TeamPlanQuota } from "@/config/team";
import {
  createUserCustomDomain,
  getUserCustomDomainById,
  getUserCustomDomains,
} from "@/lib/dto/custom-domain";
import { checkUserStatus } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";
import { z } from "zod";

// 获取用户自定义域名列表
export async function GET(req: Request) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (id) {
      // 获取单个自定义域名详情
      const result = await getUserCustomDomainById(user.id, id);
      return Response.json(result);
    } else {
      // 获取所有自定义域名
      const result = await getUserCustomDomains(user.id);
      return Response.json(result);
    }
  } catch (error) {
    console.error("获取自定义域名错误:", error);
    return Response.json(
      { status: "error", message: "获取自定义域名失败" },
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
      if (data && data.length >= TeamPlanQuota[user.team || "free"].customDomains) {
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