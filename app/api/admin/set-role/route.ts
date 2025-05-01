import { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { isUserAdmin } from "@/lib/utils/admin-check";
import { logError, logInfo } from "@/lib/utils/log-to-db";

export async function POST(request: NextRequest) {
  try {
    // 从请求头获取开发者令牌
    const devToken = request.headers.get("x-dev-token") || undefined;

    // 检查当前用户是否有管理员权限
    const isAdmin = await isUserAdmin(devToken);
    if (!isAdmin) {
      logError("无权设置用户角色", { action: "set-role", ip: request.ip });
      return errorResponse("无权限设置用户角色，需要管理员权限", 403);
    }

    // 解析请求体
    const { userId, role } = await request.json();

    // 验证参数
    if (!userId || !role) {
      return errorResponse("缺少必要参数: userId 和 role", 400);
    }

    // 验证角色是否有效
    if (!["USER", "ADMIN"].includes(role)) {
      return errorResponse("无效的角色，必须是 USER 或 ADMIN", 400);
    }

    // 检查用户是否存在
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      return errorResponse("用户不存在", 404);
    }

    // 更新用户角色
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { role: role === "ADMIN" ? "ADMIN" : "USER" },
      });

      logInfo(`成功将用户 ${userId} 的角色设置为 ${role}`);
      return successResponse({ userId, role }, "用户角色已更新");
    } catch (error) {
      logError("更新用户角色失败", { error, userId, role });
      return errorResponse("更新用户角色时发生错误", 500);
    }
  } catch (error) {
    console.error("设置用户角色失败:", error);
    return errorResponse("设置用户角色时发生错误", 500);
  }
}
