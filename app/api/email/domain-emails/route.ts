import { NextRequest } from "next/server";
import { auth } from "auth";
import { z } from "zod";

import { errorResponse, successResponse } from "@/lib/api-response";
import { getUserCustomDomainById } from "@/lib/dto/custom-domain";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

// 参数验证
const queryParamsSchema = z.object({
  domainId: z.string().min(1, "域名ID不能为空")
});

/**
 * 获取特定域名下的所有邮箱API
 */
export async function GET(request: NextRequest) {
  try {
    // 验证用户权限
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse("未授权访问", 401);
    }

    const userId = session.user.id;
    
    // 验证请求参数
    const searchParams = request.nextUrl.searchParams;
    const domainIdParam = searchParams.get("domainId");
    
    if (!domainIdParam) {
      return errorResponse("缺少域名ID参数", 400);
    }
    
    const validationResult = queryParamsSchema.safeParse({ domainId: domainIdParam });
    if (!validationResult.success) {
      return errorResponse(validationResult.error.message, 400);
    }
    
    // 使用经过验证的domainId
    const { domainId } = validationResult.data;
    
    // 获取域名信息并验证所有权
    const domainResult = await getUserCustomDomainById(userId, domainId);
    if (domainResult.status !== "success" || !domainResult.data) {
      return errorResponse(domainResult.message || "获取域名信息失败", 400);
    }
    
    const domain = domainResult.data;
    
    // 查询该域名下的所有邮箱
    const emails = await prisma.userEmail.findMany({
      where: {
        userId: userId,
        emailAddress: {
          endsWith: `@${domain.domainName}`
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        emailAddress: true,
        createdAt: true,
        updatedAt: true,
        // 包含未读邮件数量
        forwardEmails: {
          select: {
            id: true
          },
          where: {
            readAt: null
          }
        }
      }
    });
    
    // 处理返回数据
    const formattedEmails = emails.map(email => ({
      id: email.id,
      emailAddress: email.emailAddress,
      createdAt: email.createdAt,
      updatedAt: email.updatedAt,
      unreadCount: email.forwardEmails.length
    }));
    
    // 返回结果
    return successResponse({
      domain: {
        id: domain.id,
        domainName: domain.domainName,
        enableEmail: domain.enableEmail,
        emailVerified: domain.emailVerified
      },
      emails: formattedEmails,
      totalCount: formattedEmails.length
    });
  } catch (error) {
    await  logger.error("获取域名邮箱列表失败", error);
    return errorResponse("获取域名邮箱列表失败", 500);
  }
}

/**
 * 创建新邮箱地址
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户权限
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse("未授权访问", 401);
    }

    const userId = session.user.id;
    
    // 验证请求数据
    const requestData = await request.json();
    const { domainId, localPart } = requestData;
    
    if (!domainId || !localPart) {
      return errorResponse("缺少必要参数", 400);
    }
    
    // 验证域名所有权
    const domainResult = await getUserCustomDomainById(userId, domainId);
    if (domainResult.status !== "success" || !domainResult.data) {
      return errorResponse(domainResult.message || "获取域名信息失败", 400);
    }
    
    const domain = domainResult.data;
    
    // 检查域名是否启用邮箱服务
    if (!domain.enableEmail) {
      return errorResponse("此域名未启用邮箱服务", 400);
    }
    
    // 验证本地部分格式
    if (localPart.length < 3 || /[^a-zA-Z0-9._-]/.test(localPart)) {
      return errorResponse("邮箱地址格式不合规范", 400);
    }
    
    // 组合完整邮箱地址
    const emailAddress = `${localPart}@${domain.domainName}`;
    
    // 检查邮箱是否已存在
    const existingEmail = await prisma.userEmail.findUnique({
      where: {
        emailAddress
      }
    });
    
    if (existingEmail) {
      return errorResponse("邮箱地址已存在", 409);
    }
    
    // 创建新邮箱
    const newEmail = await prisma.userEmail.create({
      data: {
        userId,
        emailAddress
      }
    });
    
    logger.info(`创建新邮箱: ${emailAddress}`, { userId });
    
    return successResponse({
      id: newEmail.id,
      emailAddress: newEmail.emailAddress,
      createdAt: newEmail.createdAt
    }, "邮箱创建成功");
  } catch (error) {
    await  logger.error("创建新邮箱失败", error);
    return errorResponse("创建新邮箱失败", 500);
  }
} 