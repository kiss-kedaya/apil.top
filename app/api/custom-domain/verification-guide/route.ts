import { getUserCustomDomainById } from "@/lib/dto/custom-domain";
import { checkUserStatus } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";
import { env } from "@/env.mjs";

// 获取域名验证指南
export async function GET(req: Request) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return Response.json(
        { status: "error", message: "缺少域名ID" },
        { status: 400 }
      );
    }

    // 获取域名详情
    const result = await getUserCustomDomainById(user.id, id);
    
    if (result.status === "error") {
      return Response.json(result, { status: 400 });
    }

    if (!result.data) {
      return Response.json(
        { status: "error", message: "域名不存在" },
        { status: 404 }
      );
    }

    const domain = result.data;
    
    // 构建验证指南
    const verificationGuide = {
      verificationMethod: "DNS验证",
      steps: [
        {
          step: 1,
          title: "登录DNS管理面板",
          description: "登录到您的域名DNS管理面板（如Cloudflare、GoDaddy、阿里云等）。"
        },
        {
          step: 2,
          title: "添加TXT记录",
          description: "在DNS管理页面添加一条TXT记录：",
          details: {
            type: "TXT",
            name: `_kedaya.${domain.domainName}`,
            value: domain.verificationKey,
            ttl: "自动或600（10分钟）"
          }
        },
        {
          step: 3,
          title: "等待DNS生效",
          description: "DNS记录可能需要一些时间才能生效，通常在几分钟内，但最长可能需要48小时。"
        },
        {
          step: 4,
          title: "验证所有权",
          description: "返回控制台，点击\"验证\"按钮完成域名所有权验证。"
        }
      ],
      additionalSetup: [
        {
          title: "验证通过后",
          description: "验证通过后，您需要将域名指向我们的服务器。请添加以下记录："
        },
        {
          type: "A",
          name: "@",
          value: env.SERVER_IP || "请联系管理员获取服务器IP",
          description: "将您的根域名指向我们的服务器"
        },
        {
          type: "CNAME",
          name: "www",
          value: domain.domainName,
          description: "将www子域指向您的根域名"
        }
      ],
      additionalResources: [
        {
          title: "DNS管理教程",
          url: "https://support.cloudflare.com/hc/zh-cn/articles/360019093151"
        },
        {
          title: "常见问题解答",
          url: "/docs/custom-domains#常见问题"
        }
      ],
      verificationStatus: {
        isVerified: domain.isVerified,
        verificationKey: domain.verificationKey,
        lastChecked: new Date().toISOString()
      }
    };
    
    // 返回验证指南
    return Response.json({ 
      status: "success", 
      data: {
        id: domain.id,
        domainName: domain.domainName,
        isVerified: domain.isVerified,
        verificationKey: domain.verificationKey,
        guide: verificationGuide
      }
    });
    
  } catch (error) {
    console.error("获取域名验证指南错误:", error);
    return Response.json(
      { status: "error", message: "获取域名验证指南失败" },
      { status: 500 }
    );
  }
} 