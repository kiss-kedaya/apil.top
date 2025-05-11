import { z } from "zod";

import { checkUserStatus } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";

// 验证域名格式的schema
const domainSchema = z.object({
  domainName: z
    .string()
    .min(3)
    .regex(/^[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+$/),
});

// 检查域名可用性
export async function POST(req: Request) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;

    // 获取请求体中的域名
    const data = await req.json();

    // 验证域名格式
    try {
      domainSchema.parse(data);
    } catch (error) {
      return Response.json(
        { status: "error", message: "域名格式不正确" },
        { status: 400 },
      );
    }

    const { domainName } = data;

    // 检查域名格式和黑名单
    if (isBlacklistedDomain(domainName)) {
      return Response.json(
        { status: "error", message: "此域名不可用" },
        { status: 400 },
      );
    }

    // 检查DNS解析
    try {
      const dnsCheckResult = await checkDomainDNS(domainName);
      if (!dnsCheckResult.available) {
        return Response.json(
          {
            status: "error",
            message: dnsCheckResult.message || "域名DNS检查失败",
            details: dnsCheckResult.details,
          },
          { status: 400 },
        );
      }
    } catch (error) {
      console.error("检查域名DNS错误:", error);
      return Response.json(
        { status: "error", message: "检查域名DNS时出错" },
        { status: 500 },
      );
    }

    // 域名可用
    return Response.json({
      status: "success",
      data: {
        available: true,
        domainName,
      },
    });
  } catch (error) {
    console.error("检查域名可用性错误:", error);
    return Response.json(
      { status: "error", message: "检查域名可用性失败" },
      { status: 500 },
    );
  }
}

// 检查域名是否在黑名单中
function isBlacklistedDomain(domain: string): boolean {
  // 黑名单域名列表
  const blacklist = [
    "qali.cn", // 系统主域名
    "kedaya.com",
    "example.com",
    "example.org",
    "test.com",
    "localhost",
  ];

  // 检查域名是否在黑名单中
  return blacklist.some(
    (item) => domain === item || domain.endsWith(`.${item}`),
  );
}

// 检查域名DNS
async function checkDomainDNS(domain: string): Promise<{
  available: boolean;
  message?: string;
  details?: any;
}> {
  try {
    // 检查域名A记录
    const dnsResponse = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${domain}&type=A`,
      {
        headers: {
          Accept: "application/dns-json",
        },
      },
    );

    const dnsData = await dnsResponse.json();

    // 如果域名没有A记录，可能是域名未配置或不存在
    if (!dnsData.Answer || dnsData.Answer.length === 0) {
      // 进一步检查NS记录，确认域名是否存在
      const nsResponse = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${domain}&type=NS`,
        {
          headers: {
            Accept: "application/dns-json",
          },
        },
      );

      const nsData = await nsResponse.json();

      // 如果没有NS记录，域名可能未注册
      if (!nsData.Answer || nsData.Answer.length === 0) {
        return {
          available: false,
          message: "域名可能未注册或未配置DNS",
          details: { hasNS: false, hasA: false },
        };
      }

      // 域名有NS记录但没有A记录，可用
      return { available: true };
    }

    // 检查现有A记录是否指向我们的服务器
    const serverIP = process.env.SERVER_IP || "127.0.0.1";
    const pointsToOurServer = dnsData.Answer.some(
      (record) => record.data === serverIP,
    );

    if (pointsToOurServer) {
      return { available: true };
    }

    // A记录指向其他服务器，可能已被使用
    return {
      available: false,
      message: "域名已经指向其他服务器，请更新DNS记录",
      details: {
        hasA: true,
        currentRecords: dnsData.Answer.map((r: any) => r.data),
      },
    };
  } catch (error) {
    console.error("DNS检查错误:", error);
    return { available: false, message: "DNS检查过程中出错" };
  }
}
