import { getUserCustomDomainById } from "@/lib/dto/custom-domain";
import { checkUserStatus } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";
import { Vercel } from '@vercel/sdk';

// 条件性创建Vercel实例，避免无token时报错
const vercel = process.env.VERCEL_TOKEN 
  ? new Vercel({ bearerToken: process.env.VERCEL_TOKEN })
  : null;
const projectName = process.env.VERCEL_PROJECT_NAME || '';

// 定义Vercel状态接口
interface VercelStatus {
  misconfigured?: boolean;
  verified?: boolean;
  config?: any;
  error?: string;
}

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
  console.log('📝 收到域名验证状态检查请求');
  
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) {
      console.log('❌ 用户未认证');
      return user;
    }
    console.log('✅ 用户已认证:', user.id);

    const { id } = await req.json();
    if (!id) {
      console.log('❌ 缺少域名ID参数');
      return Response.json(
        { status: "error", message: "缺少域名ID" },
        { status: 400 }
      );
    }
    console.log('📝 检查域名ID:', id);

    // 获取域名详情
    const result = await getUserCustomDomainById(user.id, id);
    if (result.status === "error" || !result.data) {
      console.log('❌ 域名不存在');
      return Response.json(
        { status: "error", message: "域名不存在" },
        { status: 404 }
      );
    }

    const domain = result.data;
    console.log('📝 找到域名:', {
      id: domain.id,
      domainName: domain.domainName,
      isVerified: domain.isVerified
    });

    // 检查Vercel验证状态
    let vercelStatus: VercelStatus | null = null;
    if (vercel && domain.domainName) {
      try {
        console.log("🌐 检查Vercel域名状态:", domain.domainName);
        
        const checkVercel = await vercel.domains.getDomainConfig({
          domain: domain.domainName,
        });
        
        vercelStatus = {
          misconfigured: checkVercel.misconfigured,
          verified: !checkVercel.misconfigured,
          config: checkVercel,
        };
        
        console.log("🌐 Vercel域名状态:", {
          domain: domain.domainName,
          misconfigured: vercelStatus.misconfigured,
          verified: vercelStatus.verified
        });
      } catch (vercelError) {
        console.error("❌ 检查Vercel域名状态出错:", vercelError);
        vercelStatus = { error: String(vercelError) };
      }
    } else {
      console.log("⚠️ 跳过Vercel验证检查:", {
        hasVercel: !!vercel,
        hasDomain: !!domain.domainName
      });
    }

    // 初始化验证状态
    let verificationStatus: VerificationStatus = {
      isVerified: domain.isVerified,
      domainName: domain.domainName,
      lastChecked: new Date().toISOString(),
    };

    // 如果已验证，直接返回
    if (domain.isVerified) {
      console.log('✅ 域名已验证，直接返回状态');
      return Response.json({
        status: "success",
        data: {
          ...verificationStatus,
          vercel: vercelStatus,
        },
      });
    }

    // 如果尚未验证，检查验证状态
    try {
      // 检查DNS TXT记录
      const txtRecordName = `_kedaya.${domain.domainName}`;
      console.log('📝 检查TXT记录:', txtRecordName);
      
      const dnsResponse = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${txtRecordName}&type=TXT`,
        {
          headers: {
            Accept: "application/dns-json",
          },
        },
      );

      const dnsData = await dnsResponse.json();
      console.log("📝 DNS查询结果:", JSON.stringify(dnsData, null, 2));

      if (dnsData.Answer && dnsData.Answer.length > 0) {
        let foundValidKey = false;
        const currentValues = dnsData.Answer.map((r: any) => r.data.replace(/"/g, ""));
        console.log("📝 发现TXT记录:", currentValues);

        for (const answer of dnsData.Answer) {
          const txtValue = answer.data.replace(/"/g, "");
          if (txtValue === domain.verificationKey) {
            foundValidKey = true;
            console.log("✅ 验证密钥匹配成功:", txtValue);
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
        
        console.log("📝 TXT记录验证结果:", {
          exists: true,
          isValid: foundValidKey,
          expectedValue: domain.verificationKey
        });
      } else {
        console.log("❌ 未发现TXT记录");
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
      console.error("❌ 检查验证状态错误:", error);
      verificationStatus = {
        ...verificationStatus,
        error: "检查验证状态时出错",
      };
    }

    console.log("📤 返回验证状态:", {
      status: "success",
      isVerified: verificationStatus.isVerified,
      domainName: verificationStatus.domainName,
      txtRecordExists: verificationStatus.txtRecord?.exists,
      txtRecordValid: verificationStatus.txtRecord?.isValid
    });

    return Response.json({
      status: "success",
      data: {
        ...verificationStatus,
        vercel: vercelStatus,
      },
      tips: {
        title: "验证问题常见原因",
        items: [
          "TXT记录可能尚未生效，DNS传播通常需要几分钟至48小时",
          "记录名称不正确，应为 _kedaya (注意是添加到您的域名前)",
          "记录值不匹配，确保完全与所提供的验证密钥一致",
          "某些DNS提供商可能需要不同格式，请查阅您DNS服务商的文档",
          "如使用Cloudflare，请确保代理状态设为'仅DNS'（灰色云朵）"
        ]
      }
    });
  } catch (error) {
    console.error("❌ 检查验证状态错误:", error);
    return Response.json(
      { status: "error", message: "验证检查过程中发生错误" },
      { status: 500 }
    );
  }
}
