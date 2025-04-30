import { getUserCustomDomainById } from "@/lib/dto/custom-domain";
import { checkUserStatus } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";

// 定义验证状态接口
interface VerificationStatus {
  isVerified: boolean;
  domainName: string;
  lastChecked: string;
  txtRecord?: {
    exists: boolean;
    isValid: boolean;
    expectedValue: string;
    currentValues?: string[];
    expectedHost?: string;
    resolvedHost?: string;
  };
  error?: string;
}

// 检查域名验证状态
export async function POST(req: Request) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;

    const { id } = await req.json();
    if (!id) {
      return Response.json(
        { status: "error", message: "缺少域名ID" },
        { status: 400 }
      );
    }

    // 获取域名详情
    const result = await getUserCustomDomainById(user.id, id);
    if (result.status === "error" || !result.data) {
      return Response.json(
        { status: "error", message: "域名不存在" },
        { status: 404 }
      );
    }

    const domain = result.data;

    // 初始化验证状态
    let verificationStatus: VerificationStatus = {
      isVerified: domain.isVerified,
      domainName: domain.domainName,
      lastChecked: new Date().toISOString(),
    };

    // 如果已验证，直接返回
    if (domain.isVerified) {
      return Response.json({
        status: "success",
        data: verificationStatus,
      });
    }

    // 如果尚未验证，检查验证状态
    try {
      // 检查DNS TXT记录
      const txtRecordName = `_kedaya.${domain.domainName}`;
      const dnsResponse = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${txtRecordName}&type=TXT`,
        {
          headers: {
            Accept: "application/dns-json",
          },
        },
      );

      const dnsData = await dnsResponse.json();
      console.log("DNS查询结果:", dnsData);

      if (dnsData.Answer && dnsData.Answer.length > 0) {
        let foundValidKey = false;
        const currentValues = dnsData.Answer.map((r: any) => r.data.replace(/"/g, ""));

        for (const answer of dnsData.Answer) {
          const txtValue = answer.data.replace(/"/g, "");
          if (txtValue === domain.verificationKey) {
            foundValidKey = true;
            break;
          }
        }

        verificationStatus = {
          ...verificationStatus,
          txtRecord: {
            exists: true,
            isValid: foundValidKey,
            expectedValue: domain.verificationKey,
            currentValues,
            expectedHost: "_kedaya",
            resolvedHost: txtRecordName,
          },
        };
      } else {
        verificationStatus = {
          ...verificationStatus,
          txtRecord: {
            exists: false,
            isValid: false,
            expectedValue: domain.verificationKey,
            expectedHost: "_kedaya",
            resolvedHost: txtRecordName,
          },
        };
      }
    } catch (error) {
      console.error("检查验证状态错误:", error);
      verificationStatus = {
        ...verificationStatus,
        error: "检查验证状态时出错",
      };
    }

    return Response.json({
      status: "success",
      data: verificationStatus,
      tips: {
        title: "验证问题常见原因",
        items: [
          "TXT记录可能尚未生效，DNS传播通常需要几分钟至48小时",
          "记录名称不正确，应为 _kedaya (注意是添加到您的域名前)",
          "记录值不匹配，确保完全与所提供的验证密钥一致",
          "某些DNS提供商可能需要不同格式，请查阅您DNS服务商的文档",
          "如使用Cloudflare，请确保代理状态设为"仅DNS"（灰色云朵）"
        ]
      }
    });
  } catch (error) {
    console.error("检查验证状态错误:", error);
    return Response.json(
      { status: "error", message: "验证检查过程中发生错误" },
      { status: 500 }
    );
  }
}
