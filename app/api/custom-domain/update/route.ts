import { NextRequest } from "next/server";
import { updateUserCustomDomain, verifyUserCustomDomain } from "@/lib/dto/custom-domain";
import { checkUserStatus } from "@/lib/dto/user"; 
import { getCurrentUser } from "@/lib/session";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";

// CORS预检请求处理
export async function OPTIONS() {
  return Response.json(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// 更新自定义域名
export async function POST(request: NextRequest) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;

    const data = await request.json();
    const result = await updateUserCustomDomain(user.id, data);

    if (result.status === "error") {
      return errorResponse(result.message || "更新域名失败", 400);
    }

    return successResponse(result.data, "域名更新成功");
  } catch (error) {
    return handleApiError(error, "更新自定义域名失败");
  }
}

// 验证域名所有权
export async function PUT(request: NextRequest) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;

    const { id } = await request.json();
    if (!id) {
      return errorResponse("缺少域名ID", 400);
    }

    const result = await verifyUserCustomDomain(user.id, id);
    if (result.status === "error") {
      return errorResponse(result.message || "验证域名失败", 400);
    }

    return successResponse(result.data, "域名验证成功");
  } catch (error) {
    return handleApiError(error, "验证自定义域名失败");
  }
} 