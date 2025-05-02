import dns from 'dns';
import { promisify } from 'util';
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// DNS 查询Promise化
const resolveTxt = promisify(dns.resolveTxt);
const resolveMx = promisify(dns.resolveMx);

/**
 * 域名服务类 - 处理域名验证和服务配置
 */
export class DomainService {
  /**
   * 验证域名所有权
   * @param domainName 域名名称
   * @param verificationKey 验证密钥
   */
  public static async verifyDomainOwnership(domainName: string, verificationKey: string): Promise<boolean> {
    try {
      // 查询域名的TXT记录
      const txtRecords = await resolveTxt(domainName);
      
      // 检查是否包含验证值
      const expectedValue = `verify=${verificationKey}`;
      for (const recordSet of txtRecords) {
        for (const record of recordSet) {
          if (record.includes(expectedValue)) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      logger.error(`域名验证失败: ${domainName}`, { error });
      return false;
    }
  }

  /**
   * 验证域名的邮箱配置
   * @param domainName 域名名称
   */
  public static async verifyEmailConfiguration(domainName: string): Promise<{
    success: boolean;
    mx: boolean;
    spf: boolean;
    dkim: boolean;
    dmarc: boolean;
    issues: string[];
  }> {
    try {
      const issues: string[] = [];
      
      // 验证MX记录
      let mxValid = false;
      try {
        const mxRecords = await resolveMx(domainName);
        mxValid = mxRecords.length > 0;
        if (!mxValid) {
          issues.push('未找到MX记录');
        }
      } catch (error) {
        issues.push('MX记录查询失败');
      }
      
      // 验证SPF记录
      let spfValid = false;
      try {
        const txtRecords = await resolveTxt(domainName);
        for (const recordSet of txtRecords) {
          for (const record of recordSet) {
            if (record.startsWith('v=spf1')) {
              spfValid = true;
              break;
            }
          }
          if (spfValid) break;
        }
        if (!spfValid) {
          issues.push('未找到SPF记录');
        }
      } catch (error) {
        issues.push('SPF记录查询失败');
      }
      
      // 验证DKIM记录
      let dkimValid = false;
      try {
        const dkimSelector = 'mail._domainkey';
        const dkimRecords = await resolveTxt(`${dkimSelector}.${domainName}`);
        dkimValid = dkimRecords.length > 0;
        if (!dkimValid) {
          issues.push('未找到DKIM记录');
        }
      } catch (error) {
        issues.push('DKIM记录查询失败');
      }
      
      // 验证DMARC记录
      let dmarcValid = false;
      try {
        const dmarcRecords = await resolveTxt(`_dmarc.${domainName}`);
        for (const recordSet of dmarcRecords) {
          for (const record of recordSet) {
            if (record.startsWith('v=DMARC1')) {
              dmarcValid = true;
              break;
            }
          }
          if (dmarcValid) break;
        }
        if (!dmarcValid) {
          issues.push('未找到DMARC记录');
        }
      } catch (error) {
        issues.push('DMARC记录查询失败');
      }
      
      const success = mxValid && spfValid && dkimValid && dmarcValid;
      
      return {
        success,
        mx: mxValid,
        spf: spfValid,
        dkim: dkimValid,
        dmarc: dmarcValid,
        issues
      };
    } catch (error) {
      logger.error(`邮箱配置验证失败: ${domainName}`, { error });
      return {
        success: false,
        mx: false,
        spf: false,
        dkim: false,
        dmarc: false,
        issues: ['邮箱配置验证过程中发生错误']
      };
    }
  }

  /**
   * 为域名生成唯一的验证密钥
   */
  public static generateVerificationKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 更新域名的邮箱服务状态
   * @param domainId 域名ID
   * @param enableEmail 是否启用邮箱服务
   * @param emailVerified 邮箱服务是否已验证
   */
  public static async updateEmailService(
    domainId: string, 
    enableEmail: boolean, 
    emailVerified: boolean
  ): Promise<void> {
    try {
      await prisma.userCustomDomain.update({
        where: { id: domainId },
        data: { 
          enableEmail,
          emailVerified
        }
      });
    } catch (error) {
      logger.error(`更新域名邮箱服务状态失败: ${domainId}`, { error });
      throw new Error('更新域名邮箱服务状态失败');
    }
  }

  /**
   * 配置域名的SMTP服务
   * @param domainId 域名ID
   * @param smtpConfig SMTP配置信息
   */
  public static async configureSmtp(
    domainId: string,
    smtpConfig: {
      smtpServer: string;
      smtpPort: number;
      smtpUsername: string;
      smtpPassword: string;
      fromEmail: string;
    }
  ): Promise<void> {
    try {
      await prisma.userCustomDomain.update({
        where: { id: domainId },
        data: smtpConfig
      });
    } catch (error) {
      logger.error(`配置域名SMTP服务失败: ${domainId}`, { error });
      throw new Error('配置域名SMTP服务失败');
    }
  }

  /**
   * 获取域名的短链接解析信息
   * @param hostname 请求的主机名
   */
  public static async resolveUrlForDomain(hostname: string): Promise<{ userId: string; domainName: string } | null> {
    try {
      // 查找匹配的自定义域名
      const domain = await prisma.userCustomDomain.findFirst({
        where: {
          domainName: hostname,
          isVerified: true
        },
        select: {
          userId: true,
          domainName: true
        }
      });
      
      return domain;
    } catch (error) {
      logger.error(`解析域名短链接信息失败: ${hostname}`, { error });
      return null;
    }
  }
} 