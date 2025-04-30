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
    
    // 检查域名验证状态
    let verificationStatus: VerificationStatus = {
      isVerified: domain.isVerified,
      domainName: domain.domainName,
      lastChecked: new Date().toISOString(),
    };
    
    // 如果尚未验证，检查验证状态
    if (!domain.isVerified) {
      try {
        // 检查DNS TXT记录
        const txtRecordName = `_kedaya.${domain.domainName}`;
        const dnsResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=${txtRecordName}&type=TXT`, {
          headers: {
            'Accept': 'application/dns-json'
          }
        });
        
        const dnsData = await dnsResponse.json();
        
        if (dnsData.Answer && dnsData.Answer.length > 0) {
          let foundValidKey = false;
          for (const answer of dnsData.Answer) {
            const txtValue = answer.data.replace(/"/g, '');
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
              currentValues: dnsData.Answer.map((r: any) => r.data.replace(/"/g, '')),
            }
          };
        } else {
          verificationStatus = {
            ...verificationStatus,
            txtRecord: {
              exists: false,
              isValid: false,
              expectedValue: domain.verificationKey,
            }
          };
        }
      } catch (error) {
        console.error("检查验证状态错误:", error);
        verificationStatus = {
          ...verificationStatus,
          error: "检查验证状态时出错"
        };
      }
    }
    
    return Response.json({
      status: "success",
      data: verificationStatus
    });
  } catch (error) {
    console.error("检查域名验证状态错误:", error);
    return Response.json(
      { status: "error", message: "检查域名验证状态失败" },
      { status: 500 }
    );
  }
} 