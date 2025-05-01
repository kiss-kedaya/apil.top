import { NextRequest } from "next/server";
import { auth } from "auth";

import { errorResponse, successResponse } from "@/lib/api-response";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // 获取当前会话
    const session = await auth();
    
    // 如果没有登录，返回未授权
    if (!session?.user?.id) {
      return errorResponse("未登录", 401);
    }
    
    // 查询用户详细信息
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        team: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return errorResponse("用户不存在", 404);
    }
    
    // 返回用户信息
    return successResponse({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.role === "ADMIN",
      active: user.active === 1,
      team: user.team,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error("获取用户信息失败:", error);
    return errorResponse("获取用户信息失败", 500);
  }
} 