import { NextRequest } from "next/server";
import { auth } from "auth";
import { z } from "zod";

import { errorResponse, successResponse } from "@/lib/api-response";
import { getUserCustomDomainById } from "@/lib/dto/custom-domain";
import { DomainService } from "@/lib/domain-service";
import { logger } from "@/lib/logger";

// 域名ID验证模式
const domainIdSchema = z.object({
  domainId: z.string().min(1, '域名ID不能为空'),
});

/**
 * 一键启用邮箱服务API
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
    const data = await request.json();
    const validationResult = domainIdSchema.safeParse(data);
    
    if (!validationResult.success) {
      return errorResponse(validationResult.error.message, 400);
    }
    
    const { domainId } = validationResult.data;
    
    // 获取域名信息
    const domainResult = await getUserCustomDomainById(userId, domainId);
    if (domainResult.status !== "success" || !domainResult.data) {
      return errorResponse(domainResult.message || "获取域名信息失败", 400);
    }
    
    const domain = domainResult.data;
    
    // 检查域名是否已验证
    if (!domain.isVerified) {
      return errorResponse("请先验证域名所有权后再启用邮箱服务", 400);
    }
    
    // 启用邮箱服务
    try {
      await DomainService.enableEmailService(domainId);
      
      // 检查邮箱配置
      const emailConfig = await DomainService.verifyEmailConfiguration(domain.domainName);
      
      // 初始设置默认未验证，用户需要配置DNS后再验证
      const emailVerified = emailConfig.success;
      await DomainService.updateEmailService(domainId, true, emailVerified);
      
      // 返回邮箱设置状态
      return successResponse({
        enableEmail: true,
        emailVerified: emailVerified,
        emailConfig,
        // 添加默认邮箱地址样例
        defaultEmails: [
          `admin@${domain.domainName}`,
          `info@${domain.domainName}`,
          `contact@${domain.domainName}`,
          `support@${domain.domainName}`
        ],
        // DNS配置指导
        dnsRecords: [
          {
            type: "MX",
            name: domain.domainName,
            value: `10 mail.apil.top`,
            explanation: "用于接收发送到您域名的电子邮件"
          },
          {
            type: "TXT",
            name: domain.domainName,
            value: `v=spf1 include:apil.top ~all`,
            explanation: "邮件发送者验证，防止伪造邮件"
          }
        ]
      }, "邮箱服务已启用，请按照指南配置DNS记录");
    } catch (error) {
      logger.error("启用邮箱服务失败", error);
      return errorResponse("启用邮箱服务失败", 500);
    }
  } catch (error) {
    logger.error("处理邮箱服务启用请求失败", error);
    return errorResponse("处理请求失败", 500);
  }
} 