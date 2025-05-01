import { NextRequest, NextResponse } from "next/server";
import { auth } from "auth";

import { verifyUserCustomDomain } from "@/lib/dto/custom-domain";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";

// CORS预检请求处理
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// 验证特定ID的域名
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const domainId = params.id;
    console.log(`🔍 开始验证域名ID: ${domainId}`);

    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse("未授权访问", 401);
    }

    const userId = session.user.id;
    console.log(`👤 用户ID: ${userId}`);

    // 执行域名验证
    const result = await verifyUserCustomDomain(userId, domainId);
    
    if (result.status === "error") {
      console.log(`❌ 域名验证失败: ${result.message}`);
      return errorResponse(result.message || "域名验证失败", 400, result.details);
    }
    
    console.log(`✅ 域名验证成功: ${domainId}`);
    return successResponse(result.data, "域名验证成功");
  } catch (error) {
    return handleApiError(error, "域名验证失败");
  }
} 