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

// 邮箱状态类型定义
interface EmailStatus {
  verified: boolean;
  mx: boolean;
  spf: boolean;
  issues: string[];
  dnsRecords: Array<{
    type: string;
    name: string;
    value: string;
    status: string;
  }>;
}

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
        
        // 如果已启用邮箱服务，检查邮箱配置
        let emailStatus: EmailStatus | undefined = undefined;
        if (domain.enableEmail) {
          // 检查邮箱配置 - 简化版本
          const emailConfig = await DomainService.verifyEmailConfiguration(domain.domainName);
          
          // 更新邮箱验证状态
          await DomainService.updateEmailService(domainId, true, emailConfig.success);
          
          // 准备邮箱状态信息
          emailStatus = {
            verified: emailConfig.success,
            mx: emailConfig.mx,
            spf: emailConfig.spf,
            issues: emailConfig.issues,
            dnsRecords: [
              {
                type: "MX",
                name: domain.domainName,
                value: "10 mail.qali.cn",
                status: emailConfig.mx ? "正常" : "未配置"
              },
              {
                type: "TXT (SPF)",
                name: domain.domainName,
                value: `v=spf1 include:qali.cn ~all`,
                status: emailConfig.spf ? "正常" : "未配置"
              }
            ]
          };
        }
        
        return successResponse({
          isVerified: true,
          domain: {
            id: domain.id,
            domainName: domain.domainName,
            isVerified: true,
            enableEmail: domain.enableEmail,
            emailVerified: domain.enableEmail && emailStatus ? emailStatus.verified : false
          },
          emailStatus
        }, domain.enableEmail && emailStatus
          ? (emailStatus.verified 
              ? "域名验证成功，邮箱服务已验证" 
              : "域名验证成功，但邮箱服务未验证完成")
          : "域名验证成功");
      } catch (error) {
        await  logger.error("更新域名验证状态失败", error);
        return errorResponse("域名验证成功，但更新数据库失败");
      }
    } else {
      // 域名未验证，提供更详细的指导
      return successResponse({ 
        isVerified: false,
        verificationGuide: {
          // 验证域名所有权的TXT记录
          record: {
            type: "TXT",
            name: domain.domainName,
            value: `verify=${domain.verificationKey}`,
            explanation: "用于验证您对域名的所有权"
          },
          tips: [
            "确保TXT记录已正确添加",
            "DNS记录生效可能需要5分钟到48小时",
            "验证前确认DNS解析已生效"
          ]
        }
      }, "域名验证失败，请检查DNS配置");
    }
  } catch (error) {
    await  logger.error("检查域名验证状态失败", error);
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
    await  logger.error(`更新域名验证状态失败: ${domainId}`, error);
    return {
      status: "error",
      message: "更新域名验证状态失败"
    };
  }
}
