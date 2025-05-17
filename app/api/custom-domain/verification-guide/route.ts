import { NextRequest, NextResponse } from "next/server";
import { auth } from "auth";

import { env } from "@/env.mjs";
import { siteConfig } from "@/config/site";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getUserCustomDomainById } from "@/lib/dto/custom-domain";
import { logger } from "@/lib/logger";

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

    // 服务器IP地址 - 从环境变量获取或使用默认值
    const serverIP = env.SERVER_IP || "请联系管理员获取服务器IP";

    // 邮件服务器域名 - 从配置获取
    const mailServer = env.MAIL_SERVER || "mail.qali.cn";

    // 生成验证指南
    const verificationGuide = {
      // DNS记录配置
      dnsRecords: [
        // 验证域名所有权的TXT记录
        {
          type: "TXT",
          name: domain.domainName,
          value: `verify=${domain.verificationKey}`,
          explanation: "用于验证您对域名的所有权",
        },
        // 短链接解析的A记录
        {
          type: "A",
          name: domain.domainName,
          value: serverIP,
          explanation: "将您的域名解析到我们的短链接服务",
        },
      ],
      // 邮箱配置 - 简化版本
      emailRecords: [
        // MX记录 - 指向我们预部署的邮件服务
        {
          type: "MX",
          name: domain.domainName,
          value: `10 ${mailServer}`,
          explanation: "用于接收发送到您域名的电子邮件",
        },
        // SPF记录 - 允许我们的服务器发送邮件
        {
          type: "TXT",
          name: domain.domainName,
          value: `v=spf1 include:${siteConfig.mainDomains[0]} ~all`,
          explanation: "邮件发送者验证，防止伪造邮件",
        },
      ],
      // 验证说明 - 简化版本
      verificationSteps: [
        "登录您的域名注册商或DNS管理面板",
        "添加上述DNS记录",
        "等待DNS记录生效（通常需要5分钟到48小时）",
        "返回我们的网站验证您的域名",
      ],
      // 补充说明
      additionalInfo: {
        title: "邮箱服务简化配置",
        description:
          "我们已经为您预部署了邮件服务，只需添加上述基本DNS记录即可使用。无需复杂的技术配置！",
        features: [
          "一键启用邮箱服务",
          "自动创建邮箱地址",
          "通过网页界面查看所有邮件",
          "支持设置邮件转发",
        ],
      },
    };

    return successResponse(verificationGuide, "获取域名验证指南成功");
  } catch (error) {
    await logger.error("获取域名验证指南失败:", error);
    return errorResponse("获取域名验证指南失败", 500);
  }
}
