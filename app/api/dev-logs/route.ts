import { NextRequest, NextResponse } from "next/server";
import { auth } from "auth";
import { Sql } from '@prisma/client/runtime/library';

import { prisma } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/api-response";

// 检查用户是否是管理员
async function checkIsAdmin() {
  const session = await auth();
  if (!session?.user?.id) return false;
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });
    return user?.role === "ADMIN";
  } catch (error) {
    return false;
  }
}

// 清理过期的日志（保留最近7天的）
async function cleanupOldLogs() {
  try {
    // 使用原生SQL删除而不是stored procedure
    await prisma.$executeRaw`DELETE FROM dev_logs WHERE created_at < NOW() - INTERVAL '7 days'`;
    return true;
  } catch (error) {
    console.error("清理旧日志失败:", error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  // 检查是否是管理员
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return errorResponse("无权限访问", 403);
  }

  // 获取分页参数
  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get("page") || "1");
  const pageSize = Number(searchParams.get("size") || "50");
  const level = searchParams.get("level") || undefined; // info, error, warn
  const search = searchParams.get("search") || undefined;
  
  // 查询日志
  try {
    // 简化查询方法，避免使用$raw
    let totalCount = 0;
    let logs: any[] = [];
    
    if (level && search) {
      // 同时有级别和搜索条件
      const searchPattern = `%${search}%`;
      const countResult: any[] = await prisma.$queryRaw`
        SELECT COUNT(*) AS total FROM dev_logs 
        WHERE level = ${level} AND (message ILIKE ${searchPattern} OR details ILIKE ${searchPattern})
      `;
      totalCount = Number(countResult[0]?.total || 0);
      
      const offset = (page - 1) * pageSize;
      logs = await prisma.$queryRaw`
        SELECT id, level, message, details, caller, created_at as "createdAt" 
        FROM dev_logs 
        WHERE level = ${level} AND (message ILIKE ${searchPattern} OR details ILIKE ${searchPattern})
        ORDER BY created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
    } else if (level) {
      // 只有级别条件
      const countResult: any[] = await prisma.$queryRaw`
        SELECT COUNT(*) AS total FROM dev_logs WHERE level = ${level}
      `;
      totalCount = Number(countResult[0]?.total || 0);
      
      const offset = (page - 1) * pageSize;
      logs = await prisma.$queryRaw`
        SELECT id, level, message, details, caller, created_at as "createdAt" 
        FROM dev_logs 
        WHERE level = ${level}
        ORDER BY created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
    } else if (search) {
      // 只有搜索条件
      const searchPattern = `%${search}%`;
      const countResult: any[] = await prisma.$queryRaw`
        SELECT COUNT(*) AS total FROM dev_logs 
        WHERE message ILIKE ${searchPattern} OR details ILIKE ${searchPattern}
      `;
      totalCount = Number(countResult[0]?.total || 0);
      
      const offset = (page - 1) * pageSize;
      logs = await prisma.$queryRaw`
        SELECT id, level, message, details, caller, created_at as "createdAt" 
        FROM dev_logs 
        WHERE message ILIKE ${searchPattern} OR details ILIKE ${searchPattern}
        ORDER BY created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
    } else {
      // 无条件查询所有
      const countResult: any[] = await prisma.$queryRaw`
        SELECT COUNT(*) AS total FROM dev_logs
      `;
      totalCount = Number(countResult[0]?.total || 0);
      
      const offset = (page - 1) * pageSize;
      logs = await prisma.$queryRaw`
        SELECT id, level, message, details, caller, created_at as "createdAt" 
        FROM dev_logs 
        ORDER BY created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
    }
    
    // 每20次请求自动清理一次旧日志
    if (Math.random() < 0.05) {
      void cleanupOldLogs();
    }
    
    return successResponse({
      logs,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      }
    });
  } catch (error) {
    console.error("获取日志失败:", error);
    return errorResponse("获取日志失败", 500);
  }
}

// 清空日志
export async function DELETE(request: NextRequest) {
  // 检查是否是管理员
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return errorResponse("无权限操作", 403);
  }
  
  try {
    // 获取请求体
    const { all } = await request.json();
    
    if (all) {
      // 删除所有日志
      await prisma.$executeRaw`DELETE FROM dev_logs`;
      return successResponse({ message: "所有日志已清空" });
    } else {
      // 只清理7天前的日志
      const cleaned = await cleanupOldLogs();
      if (cleaned) {
        return successResponse({ message: "过期日志已清理" });
      } else {
        return errorResponse("清理日志失败", 500);
      }
    }
  } catch (error) {
    console.error("清理日志失败:", error);
    return errorResponse("清理日志失败", 500);
  }
} 