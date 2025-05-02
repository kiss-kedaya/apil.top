import { NextRequest, NextResponse } from "next/server";
import { auth } from "auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getUserCustomDomainById } from "@/lib/dto/custom-domain";

// 为用户提供域名配置指南
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const domainId = searchParams.get("id");

    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse("未授权访问", 401);
    }

    const userId = session.user.id;

    if (!domainId) {
      return errorResponse("缺少域名ID参数", 400);
    }

    // 获取域名信息
    const result = await getUserCustomDomainById(userId, domainId);
    if (result.status !== "success") {
      return errorResponse(result.message || "获取域名信息失败");
    }

    const domain = result.data;
    // 生成验证指南
    const verificationGuide = {
      // DNS记录配置
      dnsRecords: [
        // 验证域名所有权的TXT记录
        {
          type: "TXT",
          name: domain.domainName,
          value: `verify=${domain.verificationKey}`,
          explanation: "用于验证您对域名的所有权"
        },
        // 短链接解析的A记录
        {
          type: "A",
          name: domain.domainName,
          value: "你的服务器IP地址",
          explanation: "将您的域名解析到我们的短链接服务"
        }
      ],
      // 邮箱配置
      emailRecords: [
        // MX记录
        {
          type: "MX",
          name: domain.domainName,
          value: "10 mx.yourdomain.com",
          explanation: "用于接收发送到您域名的电子邮件"
        },
        // SPF记录
        {
          type: "TXT",
          name: domain.domainName,
          value: "v=spf1 include:_spf.yourdomain.com ~all",
          explanation: "邮件发送者验证，防止伪造邮件"
        },
        // DKIM记录
        {
          type: "TXT",
          name: `mail._domainkey.${domain.domainName}`,
          value: "v=DKIM1; k=rsa; p=您的DKIM公钥",
          explanation: "用于邮件签名验证，提高邮件可信度"
        },
        // DMARC记录
        {
          type: "TXT", 
          name: `_dmarc.${domain.domainName}`,
          value: "v=DMARC1; p=none; sp=none; rua=mailto:dmarc@yourdomain.com",
          explanation: "邮件验证和报告配置"
        }
      ],
      // 验证说明
      verificationSteps: [
        "登录您的域名注册商或DNS管理面板",
        "添加上述DNS记录",
        "等待DNS记录生效（通常需要5分钟到48小时）",
        "返回我们的网站验证您的域名"
      ]
    };

    return successResponse(verificationGuide, "获取域名验证指南成功");
  } catch (error) {
    console.error("获取域名验证指南失败:", error);
    return errorResponse("获取域名验证指南失败", 500);
  }
} 