import { NextResponse } from "next/server";
import { Vercel } from "@vercel/sdk";
import { auth } from "auth";
import { z } from "zod";

import { env } from "@/env.mjs";
import { TeamPlanQuota } from "@/config/team";
import {
  createUserCustomDomain,
  deleteUserCustomDomain,
  getUserCustomDomainById,
  getUserCustomDomains,
  getVerifiedUserCustomDomains,
  updateUserCustomDomain,
  verifyUserCustomDomain,
} from "@/lib/dto/custom-domain";
import { checkUserStatus } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";

// 条件性创建Vercel实例，避免无token时报错
const vercel = process.env.VERCEL_TOKEN
  ? new Vercel({ bearerToken: process.env.VERCEL_TOKEN })
  : null;
const projectName = process.env.VERCEL_PROJECT_NAME || "";

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
        },
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
      { status: 500 },
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
      if (
        data &&
        Array.isArray(data) &&
        data.length >= TeamPlanQuota[user.team || "free"].customDomains
      ) {
        return Response.json(
          { status: "error", message: "您已达到自定义域名的最大限制" },
          { status: 403 },
        );
      }
    }

    const data = await req.json();
    const result = await createUserCustomDomain(user.id, data);

    if (result.status === "error") {
      return Response.json(result, { status: 400 });
    }

    // === Vercel自动绑定域名 ===
    // 检查Vercel配置是否可用
    if (!vercel || !projectName) {
      console.warn("Vercel配置不完整，跳过域名自动绑定");
      return Response.json(result);
    }

    try {
      // 域名添加到Vercel项目
      const addDomainResponse = await vercel.projects.addProjectDomain({
        idOrName: projectName,
        requestBody: {
          name: data.domain, // 假设data.domain为用户输入的域名
        },
      });

      // 检查域名配置
      const checkConfiguration = await vercel.domains.getDomainConfig({
        domain: data.domain,
      });

      console.log("Vercel域名绑定成功:", {
        domain: addDomainResponse.name,
        verified: addDomainResponse.verified,
      });

      return Response.json({
        ...result,
        vercel: {
          domain: addDomainResponse.name,
          verified: addDomainResponse.verified,
          misconfigured: checkConfiguration.misconfigured,
          config: checkConfiguration, // 返回全部配置，前端自己取
        },
      });
    } catch (vercelError: any) {
      // 记录详细错误
      console.error("Vercel绑定域名错误:", vercelError);

      // Vercel绑定失败也返回业务成功，但带上错误信息
      return Response.json({
        ...result,
        vercel: {
          error:
            vercelError instanceof Error
              ? vercelError.message
              : String(vercelError),
        },
      });
    }
  } catch (error) {
    // 记录详细错误
    console.error("创建自定义域名错误:", error);

    return Response.json(
      {
        status: "error",
        message: "创建自定义域名失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
