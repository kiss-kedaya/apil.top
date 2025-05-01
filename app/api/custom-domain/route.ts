import { NextRequest, NextResponse } from "next/server";
import { Vercel } from "@vercel/sdk";
import { auth } from "auth";
import { z } from "zod";

import { env } from "@/env.mjs";
import { TeamPlanQuota } from "@/config/team";
import {
  errorResponse,
  handleApiError,
  successResponse,
} from "@/lib/api-response";
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

// CORS预检请求处理
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

// 获取用户自定义域名列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const verified = searchParams.get("verified");
    const id = searchParams.get("id");

    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse("未授权访问", 401);
    }

    const userId = session.user.id;

    if (id) {
      // 获取单个自定义域名详情
      const result = await getUserCustomDomainById(userId, id);
      return result.status === "success"
        ? successResponse(result.data)
        : errorResponse(result.message || "获取域名详情失败");
    } else if (verified === "true") {
      // 获取所有已验证的自定义域名
      const result = await getVerifiedUserCustomDomains(userId);
      return result.status === "success"
        ? successResponse(result.data)
        : errorResponse(result.message || "获取已验证域名失败");
    } else {
      // 获取所有自定义域名
      const result = await getUserCustomDomains(userId);
      return result.status === "success"
        ? successResponse(result.data)
        : errorResponse(result.message || "获取域名列表失败");
    }
  } catch (error) {
    return handleApiError(error, "获取自定义域名失败");
  }
}

// 创建新的自定义域名
export async function POST(request: NextRequest) {
  console.log("📝 收到自定义域名创建请求");

  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) {
      console.log("❌ 用户未认证");
      return user;
    }
    console.log("✅ 用户已认证:", user.id);

    // 检查用户配额
    const { data } = await getUserCustomDomains(user.id);
    const userDomainsCount = data && Array.isArray(data) ? data.length : 0;
    const userQuota = TeamPlanQuota[user.team || "free"].customDomains;

    console.log("📊 用户域名配额检查:", {
      userId: user.id,
      team: user.team,
      quota: userQuota,
      used: userDomainsCount,
    });

    if (data && Array.isArray(data) && userDomainsCount >= userQuota) {
      console.log("❌ 用户超出域名配额限制");
      return errorResponse("您已达到自定义域名的最大限制", 403);
    }

    const requestData = await request.json();
    console.log("📥 接收到的域名数据:", requestData);

    // 确保使用domainName字段
    if (!requestData.domainName) {
      console.log("❌ 缺少domainName参数");
      return errorResponse("缺少域名参数", 400);
    }

    console.log("📝 准备创建域名记录:", {
      userId: user.id,
      domainName: requestData.domainName,
    });

    const result = await createUserCustomDomain(user.id, requestData);
    console.log("📝 域名创建结果:", result);

    if (result.status === "error") {
      console.log("❌ 域名创建失败:", result.message);
      return errorResponse(result.message || "域名创建失败", 400);
    }

    // === Vercel自动绑定域名 ===
    // 检查Vercel配置是否可用
    if (!vercel || !projectName) {
      console.log("⚠️ Vercel配置不完整，跳过域名自动绑定:", {
        hasToken: !!process.env.VERCEL_TOKEN,
        projectName: process.env.VERCEL_PROJECT_NAME,
      });
      return successResponse(result.data, "域名创建成功");
    }

    try {
      const domainName = result.data?.domainName || requestData.domainName;

      // 域名添加到Vercel项目
      console.log("🌐 开始Vercel域名绑定:", { domainName, projectName });

      const addDomainResponse = await vercel.projects.addProjectDomain({
        idOrName: projectName,
        requestBody: {
          name: domainName,
        },
      });

      // 检查域名配置
      console.log("🌐 Vercel域名添加成功，获取域名配置:", domainName);
      const checkConfiguration = await vercel.domains.getDomainConfig({
        domain: domainName,
      });

      console.log("✅ Vercel域名绑定成功:", {
        domain: addDomainResponse.name,
        verified: addDomainResponse.verified,
        misconfigured: checkConfiguration.misconfigured,
      });

      const responseData = {
        ...result.data,
        vercel: {
          domain: addDomainResponse.name,
          verified: addDomainResponse.verified,
          misconfigured: checkConfiguration.misconfigured,
          config: checkConfiguration,
        },
      };

      console.log("📤 返回域名添加响应:", {
        status: "success",
        domainName: domainName,
        hasVercelData: true,
      });

      return successResponse(responseData, "域名创建并绑定Vercel成功");
    } catch (vercelError: any) {
      // 记录详细错误
      console.error("❌ Vercel绑定域名错误:", vercelError);

      // 更详细的错误信息
      let errorMessage =
        vercelError instanceof Error
          ? vercelError.message
          : String(vercelError);
      let errorDetails = null;

      // 尝试解析错误对象中的更多信息
      if (vercelError.response) {
        try {
          const errorBody = vercelError.response.body;
          if (typeof errorBody === "object") {
            errorDetails = errorBody;
            console.log("❌ Vercel错误详情 (对象):", errorDetails);
          } else if (typeof errorBody === "string") {
            errorDetails = JSON.parse(errorBody);
            console.log("❌ Vercel错误详情 (字符串):", errorDetails);
          }
        } catch (e) {
          console.error("❌ 解析Vercel错误详情失败:", e);
        }
      }

      // Vercel绑定失败也返回业务成功，但带上错误信息
      console.log("📤 返回域名添加响应 (带Vercel错误):", {
        status: "success",
        domainName: result.data?.domainName,
        hasVercelError: true,
      });

      // 域名创建成功，但Vercel绑定失败
      return successResponse(
        {
          ...result.data,
          vercel: {
            error: errorMessage,
            details: errorDetails,
          },
        },
        "域名创建成功，但Vercel绑定失败",
      );
    }
  } catch (error) {
    return handleApiError(error, "创建自定义域名失败");
  }
}
