import { NextRequest } from "next/server";
import { auth } from "auth";
import { z } from "zod";

import { errorResponse, successResponse } from "@/lib/api-response";
import { getUserCustomDomainById } from "@/lib/dto/custom-domain";
import { DomainService } from "@/lib/domain-service";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

// 域名ID验证模式
const domainVerificationSchema = z.object({
  domainId: z.string().min(1, '域名ID不能为空'),
});

/**
 * 检查域名验证状态API
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
    const validationResult = domainVerificationSchema.safeParse(data);
    
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
    
    // 检查域名所有权
    const isVerified = await DomainService.verifyDomainOwnership(
      domain.domainName,
      domain.verificationKey || ''
    );
    
    if (isVerified) {
      // 更新域名验证状态
      try {
        const updateResult = await updateDomainVerification(domainId);
        if (updateResult.status === "error") {
          return errorResponse(updateResult.message || "更新域名验证状态失败");
        }
        
        // 检查邮箱配置
        if (domain.enableEmail) {
          const emailConfig = await DomainService.verifyEmailConfiguration(domain.domainName);
          
          if (emailConfig.success) {
            // 更新邮箱配置状态
            await DomainService.updateEmailService(domainId, true, true);
          } else {
            // 邮箱配置验证失败，但域名验证成功
            await DomainService.updateEmailService(domainId, true, false);
          }
          
          return successResponse({
            isVerified: true,
            emailVerified: emailConfig.success,
            emailStatus: emailConfig
          }, "域名验证成功，已更新邮箱配置状态");
        }
        
        return successResponse({ isVerified: true }, "域名验证成功");
      } catch (error) {
        logger.error("更新域名验证状态失败", error);
        return errorResponse("域名验证成功，但更新数据库失败");
      }
    } else {
      return successResponse({ isVerified: false }, "域名验证失败，请检查DNS配置");
    }
  } catch (error) {
    logger.error("检查域名验证状态失败", error);
    return errorResponse("检查域名验证状态失败", 500);
  }
}

/**
 * 更新域名验证状态
 * @param domainId 域名ID
 */
async function updateDomainVerification(domainId: string) {
  try {
    // 更新域名为已验证状态
    const updatedDomain = await prisma.userCustomDomain.update({
      where: { id: domainId },
      data: { isVerified: true }
    });
    
    return {
      status: "success",
      data: updatedDomain
    };
  } catch (error) {
    logger.error(`更新域名验证状态失败: ${domainId}`, error);
    return {
      status: "error",
      message: "更新域名验证状态失败"
    };
  }
}
