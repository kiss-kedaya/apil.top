import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { siteConfig } from "@/config/site";
import { env } from "@/env.mjs";

/**
 * 域名服务类 - 处理域名验证和服务配置
 */
export class DomainService {
  /**
   * 执行DNS查询
   * @param domainName 要查询的域名
   * @param recordType 记录类型（如TXT, MX等）
   * @returns DNS查询结果
   */
  private static async performDnsQuery(domainName: string, recordType: string): Promise<any> {
    try {
      const response = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${domainName}&type=${recordType}`, 
        {
          headers: { 'Accept': 'application/dns-json' }
        }
      );
      
      if (!response.ok) {
        await  logger.error(`DNS查询失败: ${domainName}，记录类型: ${recordType}`, { status: response.status });
        return null;
      }
      
      return await response.json();
    } catch (error) {
      await  logger.error(`DNS查询异常: ${domainName}，记录类型: ${recordType}`, { error });
      return null;
    }
  }

  /**
   * 验证域名所有权
   * @param domainName 域名名称
   * @param verificationKey 验证密钥
   */
  public static async verifyDomainOwnership(domainName: string, verificationKey: string): Promise<boolean> {
    try {
      // 使用Cloudflare DNS-over-HTTPS API检查TXT记录
      const dnsData = await this.performDnsQuery(domainName, 'TXT');
      
      if (!dnsData || !dnsData.Answer || !Array.isArray(dnsData.Answer)) {
        return false;
      }
      
      // 检查是否包含验证值
      const expectedValue = `verify=${verificationKey}`;
      for (const answer of dnsData.Answer) {
        const txtValue = answer.data?.replace(/"/g, '');
        if (txtValue?.includes(expectedValue)) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      await  logger.error(`域名验证失败: ${domainName}`, { error });
      return false;
    }
  }

  /**
   * 验证域名的邮箱配置 - 简化版本，只检查基本MX和SPF记录
   * @param domainName 域名名称
   */
  public static async verifyEmailConfiguration(domainName: string): Promise<{
    success: boolean;
    mx: boolean;
    spf: boolean;
    issues: string[];
  }> {
    try {
      const issues: string[] = [];
      const mailServer = env.MAIL_SERVER || "mail.qali.cn";
      
      // 验证MX记录
      let mxValid = false;
      const mxData = await this.performDnsQuery(domainName, 'MX');
      
      if (!mxData) {
        issues.push('MX记录查询失败');
      } else if (mxData.Answer && Array.isArray(mxData.Answer)) {
        // 检查MX记录是否指向我们的邮件服务器
        mxValid = mxData.Answer.some(record => {
          const mxValue = record.data?.toLowerCase() || '';
          return mxValue.includes(mailServer.toLowerCase());
        });
      }
      
      if (!mxValid) {
        issues.push(`未找到指向 ${mailServer} 的MX记录`);
      }
      
      // 验证SPF记录
      let spfValid = false;
      const txtData = await this.performDnsQuery(domainName, 'TXT');
      
      if (!txtData) {
        issues.push('SPF记录查询失败');
      } else if (txtData.Answer && Array.isArray(txtData.Answer)) {
        // 检查是否有包含我们域名的SPF记录
        for (const answer of txtData.Answer) {
          const txtValue = answer.data?.replace(/"/g, '') || '';
          if (txtValue.startsWith('v=spf1') && 
              txtValue.includes(siteConfig.mainDomains[0])) {
            spfValid = true;
            break;
          }
        }
      }
      
      if (!spfValid) {
        issues.push(`未找到包含 ${siteConfig.mainDomains[0]} 的SPF记录`);
      }
      
      // 简化后只检查MX和SPF
      const success = mxValid && spfValid;
      
      return {
        success,
        mx: mxValid,
        spf: spfValid,
        issues
      };
    } catch (error) {
      await  logger.error(`邮箱配置验证失败: ${domainName}`, { error });
      return {
        success: false,
        mx: false,
        spf: false,
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
   * 生成随机字符串
   * @param length 字符串长度
   * @param includeSpecial 是否包含特殊字符
   * @private
   */
  private static generateRandomString(length: number, includeSpecial: boolean = false): string {
    const alphaNumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const special = '!@#$%^&*';
    const chars = includeSpecial ? alphaNumeric + special : alphaNumeric;
    
    let result = '';
    for (let i = 0; i < length; i++) {
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
      await  logger.error(`更新域名邮箱服务状态失败: ${domainId}`, { error });
      throw new Error('更新域名邮箱服务状态失败');
    }
  }

  /**
   * 启用邮箱服务 - 简化版，自动配置默认设置
   * @param domainId 域名ID
   */
  public static async enableEmailService(domainId: string): Promise<void> {
    try {
      // 获取域名信息
      const domain = await prisma.userCustomDomain.findUnique({
        where: { id: domainId }
      });
      
      if (!domain) {
        throw new Error('域名不存在');
      }
      
      // 启用邮箱服务，设置基本配置
      await prisma.userCustomDomain.update({
        where: { id: domainId },
        data: { 
          enableEmail: true,
          // 先标记为未验证，等验证通过后再更新
          emailVerified: false,
          // 默认SMTP配置
          smtpServer: env.DEFAULT_SMTP_SERVER || 'smtp.qali.cn',
          smtpPort: env.DEFAULT_SMTP_PORT ? parseInt(env.DEFAULT_SMTP_PORT) : 587,
          smtpUsername: `${domain.userId}@${domain.domainName}`,
          smtpPassword: this.generateRandomString(16, true),
          fromEmail: `noreply@${domain.domainName}`
        }
      });
      
      // 创建默认邮箱地址
      await this.createDefaultEmailAddress(domain.userId, domain.domainName);
      
      logger.info(`已启用域名邮箱服务: ${domain.domainName}`, {
        userId: domain.userId,
        domainId: domain.id
      });
    } catch (error) {
      await  logger.error(`启用邮箱服务失败: ${domainId}`, { error });
      throw new Error('启用邮箱服务失败');
    }
  }
  
  /**
   * 创建默认邮箱地址
   * @param userId 用户ID
   * @param domainName 域名
   * @private
   */
  private static async createDefaultEmailAddress(userId: string, domainName: string): Promise<void> {
    try {
      // 创建默认邮箱地址
      const defaultAddresses = ['admin', 'info', 'contact', 'support'];
      
      for (const prefix of defaultAddresses) {
        const emailAddress = `${prefix}@${domainName}`;
        
        // 检查邮箱是否已存在
        const existingEmail = await prisma.userEmail.findUnique({
          where: { emailAddress }
        });
        
        if (!existingEmail) {
          await prisma.userEmail.create({
            data: {
              userId,
              emailAddress
            }
          });
          
          logger.info(`创建默认邮箱: ${emailAddress}`, { userId });
        }
      }
    } catch (error) {
      await  logger.error(`创建默认邮箱失败`, { error, userId, domainName });
      // 不抛出异常，避免中断主流程
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
      await  logger.error(`解析域名短链接信息失败: ${hostname}`, { error });
      return null;
    }
  }
} 