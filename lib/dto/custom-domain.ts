import * as dns from "dns";
import { promisify } from "util";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { logError, logInfo, logWarn } from "@/lib/utils/log-to-db";

// 新增自定义域名验证
export const createCustomDomainSchema = z.object({
  domainName: z.string().min(1).max(100),
  enableEmail: z.boolean().optional().default(false),
});

// 更新自定义域名验证
export const updateCustomDomainSchema = z.object({
  id: z.string().min(1),
  domainName: z.string().min(1).max(100),
  isVerified: z.boolean().optional(),
  enableEmail: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
});

// 邮箱配置验证
export const emailConfigSchema = z.object({
  id: z.string().min(1),
  smtpServer: z.string().min(1),
  smtpPort: z.number().int().positive(),
  smtpUsername: z.string().min(1),
  smtpPassword: z.string().min(1),
  fromEmail: z.string().email(),
});

// 验证结果接口
interface DomainVerificationResult {
  success: boolean;
  message?: string;
  details?: {
    recordType?: string;
    host?: string;
    expectedValue?: string;
    lookupName?: string;
    actualValues?: string[];
    errorCode?: number;
    error?: string;
    [key: string]: any;
  };
}

// API返回接口
interface ApiResponseError {
  status: "error";
  message: string;
  details?: DomainVerificationResult["details"];
}

interface ApiResponseSuccess<T> {
  status: "success";
  data: T;
}

type ApiResponse<T> = ApiResponseError | ApiResponseSuccess<T>;

// 创建自定义域名
export async function createUserCustomDomain(userId: string, data: any) {
  try {
    const { domainName, enableEmail } = createCustomDomainSchema.parse(data);

    // 生成随机验证密钥
    const verificationKey = Array(16)
      .fill(0)
      .map(() => Math.random().toString(36).charAt(2))
      .join("");

    // 检查是否存在enableEmail字段，避免SQL错误
    let hasEmailFields = true;
    try {
      // 尝试获取列信息
      const columnInfo = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'user_custom_domains' 
        AND column_name = 'enableEmail'
      `;
      hasEmailFields = Array.isArray(columnInfo) && columnInfo.length > 0;
    } catch (error) {
      logWarn("检查enableEmail字段存在性失败，将假设不存在", error);
      hasEmailFields = false;
    }

    // 根据字段是否存在创建不同的SQL
    let newDomain;
    if (hasEmailFields) {
      // 完整版本 - 包含所有邮件相关字段
      newDomain = await prisma.$queryRaw`
        INSERT INTO user_custom_domains (
          id, 
          "userId", 
          "domainName", 
          "isCloudflare", 
          "verificationKey", 
          "isVerified",
          "enableEmail",
          "emailVerified",
          "smtpServer",
          "smtpPort",
          "smtpUsername",
          "smtpPassword",
          "fromEmail",
          created_at, 
          updated_at
        )
        VALUES (
          ${crypto.randomUUID()}, 
          ${userId}, 
          ${domainName}, 
          true, 
          ${verificationKey}, 
          false,
          ${enableEmail || false},
          false,
          NULL,
          NULL,
          NULL,
          NULL,
          NULL,
          NOW(), 
          NOW()
        )
        RETURNING *
      `;
    } else {
      // 兼容版本 - 不包含邮件相关字段
      newDomain = await prisma.$queryRaw`
      INSERT INTO user_custom_domains (
        id, 
        "userId", 
        "domainName", 
        "isCloudflare", 
        "verificationKey", 
        "isVerified", 
        created_at, 
        updated_at
      )
      VALUES (
        ${crypto.randomUUID()}, 
        ${userId}, 
        ${domainName}, 
        true, 
        ${verificationKey}, 
        false, 
        NOW(), 
        NOW()
      )
      RETURNING *
    `;

      // 记录字段缺失信息
      logInfo("自定义域名表缺少邮件相关字段，请运行数据库迁移");
    }

    return {
      status: "success",
      data: Array.isArray(newDomain) ? newDomain[0] : newDomain,
    };
  } catch (error) {
    logError("创建自定义域名错误", error);
    return {
      status: "error",
      message: "创建自定义域名失败",
      details: error?.message || String(error),
      error,
    };
  }
}

// 获取用户所有自定义域名
export async function getUserCustomDomains(userId: string) {
  try {
    const domains = await prisma.$queryRaw`
      SELECT * FROM user_custom_domains
      WHERE "userId" = ${userId}
      ORDER BY created_at DESC
    `;

    return { status: "success", data: domains };
  } catch (error) {
    logError("获取自定义域名列表错误", error);
    return { status: "error", message: "获取自定义域名列表失败" };
  }
}

// 获取用户已验证的自定义域名
export async function getVerifiedUserCustomDomains(userId: string) {
  try {
    const domains = await prisma.$queryRaw`
      SELECT * FROM user_custom_domains
      WHERE "userId" = ${userId} AND "isVerified" = true
      ORDER BY created_at DESC
    `;

    return { status: "success", data: domains };
  } catch (error) {
    logError("获取已验证自定义域名列表错误", error);
    return { status: "error", message: "获取已验证自定义域名列表失败" };
  }
}

// 获取单个自定义域名
export async function getUserCustomDomainById(userId: string, id: string) {
  try {
    const domain = await prisma.$queryRaw`
      SELECT * FROM user_custom_domains
      WHERE id = ${id} AND "userId" = ${userId}
      LIMIT 1
    `;

    return {
      status: "success",
      data: Array.isArray(domain) && domain.length > 0 ? domain[0] : null,
    };
  } catch (error) {
    logError("获取自定义域名详情错误", error);
    return { status: "error", message: "获取自定义域名详情失败" };
  }
}

// 删除自定义域名
export async function deleteUserCustomDomain(userId: string, id: string) {
  try {
    await prisma.$queryRaw`
      DELETE FROM user_custom_domains
      WHERE id = ${id} AND "userId" = ${userId}
    `;

    return { status: "success" };
  } catch (error) {
    logError("删除自定义域名错误", error);
    return { status: "error", message: "删除自定义域名失败" };
  }
}

// 更新自定义域名
export async function updateUserCustomDomain(userId: string, data: any) {
  try {
    const { id, domainName, isVerified, enableEmail, emailVerified } =
      updateCustomDomainSchema.parse(data);

    // 检查是否存在邮件相关字段
    let hasEmailFields = true;
    try {
      // 尝试获取列信息
      const columnInfo = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'user_custom_domains' 
        AND column_name = 'enableEmail'
      `;
      hasEmailFields = Array.isArray(columnInfo) && columnInfo.length > 0;
    } catch (error) {
      logWarn("检查enableEmail字段存在性失败，将假设不存在", error);
      hasEmailFields = false;
    }

    let updateQuery = `
      UPDATE user_custom_domains
      SET 
    `;

    const updateParts: string[] = [];

    if (domainName !== undefined) {
      updateParts.push(`"domainName" = '${domainName}'`);
    }

    if (isVerified !== undefined) {
      updateParts.push(`"isVerified" = ${isVerified}`);
    }

    // 只有当字段存在时才添加邮件相关更新
    if (hasEmailFields) {
      if (enableEmail !== undefined) {
        updateParts.push(`"enableEmail" = ${enableEmail}`);
      }

      if (emailVerified !== undefined) {
        updateParts.push(`"emailVerified" = ${emailVerified}`);
      }
    } else if (enableEmail !== undefined || emailVerified !== undefined) {
      // 如果尝试更新不存在的字段，记录警告
      logWarn(`尝试更新不存在的邮件字段，请先运行数据库迁移`, {
        enableEmail,
        emailVerified,
      });
    }

    updateParts.push(`updated_at = NOW()`);

    updateQuery += updateParts.join(", ");
    updateQuery += ` WHERE id = '${id}' AND "userId" = '${userId}' RETURNING *`;

    const result = await prisma.$queryRawUnsafe(updateQuery);

    return {
      status: "success",
      data: Array.isArray(result) && result.length > 0 ? result[0] : null,
    };
  } catch (error) {
    logError("更新自定义域名错误", error);
    return { status: "error", message: "更新自定义域名失败" };
  }
}

// 验证自定义域名
export async function verifyUserCustomDomain(
  userId: string,
  id: string,
): Promise<ApiResponse<any>> {
  try {
    logInfo(`开始验证用户域名: userId=${userId}, domainId=${id}`);

    const domainResult = await getUserCustomDomainById(userId, id);
    if (domainResult.status === "error" || !domainResult.data) {
      logError(`域名不存在: userId=${userId}, domainId=${id}`);
      return { status: "error", message: "域名不存在" };
    }

    const domain = domainResult.data;
    logInfo(
      `获取到域名信息: ${domain.domainName}, verificationKey=${domain.verificationKey}`,
    );

    // 验证域名TXT记录
    const verificationResult = await verifyDomainDNS(domain);
    logInfo(`验证结果:`, verificationResult);

    if (!verificationResult.success) {
      return {
        status: "error",
        message: `域名验证失败: ${verificationResult.message}`,
        details: verificationResult.details,
      };
    }

    // 验证通过，更新域名状态
    logInfo(`验证通过，更新域名状态为已验证`);
    const result = await prisma.$queryRaw`
      UPDATE user_custom_domains
      SET 
        "isVerified" = true,
        updated_at = NOW()
      WHERE id = ${id} AND "userId" = ${userId}
      RETURNING *
    `;

    return {
      status: "success",
      data: Array.isArray(result) && result.length > 0 ? result[0] : null,
    };
  } catch (error) {
    logError("验证自定义域名错误", error);
    return { status: "error", message: "验证域名过程中发生错误" };
  }
}

// 验证域名TXT记录 - 使用Node.js DNS模块
async function verifyDomainDNS(domain: any): Promise<DomainVerificationResult> {
  try {
    // 构建需要验证的TXT记录名称
    const txtRecordName = `_kedaya.${domain.domainName}`;
    logInfo(`验证DNS TXT记录: ${txtRecordName}`);

    // 使用Node.js内置dns模块查询TXT记录
    const resolveTxt = promisify(dns.resolveTxt);

    try {
      const txtRecords = await resolveTxt(txtRecordName);
      logInfo(`DNS查询响应:`, txtRecords);

      // 检查是否有TXT记录
      if (!txtRecords || txtRecords.length === 0) {
        logError(`未找到TXT记录: ${txtRecordName}`);
        return {
          success: false,
          message: `未找到验证TXT记录，请确保您已添加TXT记录：【主机记录: _kedaya，记录值: ${domain.verificationKey}】`,
          details: {
            recordType: "TXT",
            host: "_kedaya",
            expectedValue: domain.verificationKey,
            lookupName: txtRecordName,
          },
        };
      }

      // 检查TXT记录值是否匹配验证密钥
      logInfo(`检查TXT记录值是否匹配验证密钥: ${domain.verificationKey}`);
      let foundValidKey = false;
      const recordValues: string[] = [];

      // DNS模块的resolveTxt返回的是二维数组，每个TXT记录可能包含多个字符串片段
      for (const txtParts of txtRecords) {
        // 将可能分片的TXT记录合并
        const txtValue = txtParts.join("");
        recordValues.push(txtValue);

        logInfo(
          `- 比较 DNS值="${txtValue}" 与 验证密钥="${domain.verificationKey}"`,
        );

        if (txtValue === domain.verificationKey) {
          foundValidKey = true;
          logInfo(`找到匹配的验证密钥!`);
          break;
        }
      }

      if (!foundValidKey) {
        logError(`TXT记录验证失败，找不到匹配的验证密钥`);
        return {
          success: false,
          message:
            "TXT记录验证失败，请确保TXT记录值与系统生成的验证密钥完全一致",
          details: {
            expectedValue: domain.verificationKey,
            actualValues: recordValues,
            lookupName: txtRecordName,
          },
        };
      }

      logInfo(`域名验证成功!`);
      return { success: true };
    } catch (dnsError: any) {
      // DNS查询错误处理
      logError(`DNS查询错误:`, dnsError);
      // ENOTFOUND表示域名不存在，ENODATA表示没有对应类型的记录
      if (dnsError.code === "ENOTFOUND" || dnsError.code === "ENODATA") {
        return {
          success: false,
          message: `未找到验证TXT记录，请确保您已添加TXT记录：【主机记录: _kedaya，记录值: ${domain.verificationKey}】`,
          details: {
            recordType: "TXT",
            host: "_kedaya",
            expectedValue: domain.verificationKey,
            lookupName: txtRecordName,
            error: dnsError.code,
          },
        };
      }

      return {
        success: false,
        message: `DNS查询失败: ${dnsError.message || dnsError.code}`,
        details: {
          errorCode: dnsError.code,
          error: dnsError.message,
        },
      };
    }
  } catch (error) {
    logError("域名DNS验证错误", error);
    return {
      success: false,
      message: "验证过程中发生错误，请稍后重试",
      details: { error: String(error) },
    };
  }
}

// 配置邮箱服务
export async function configureEmailService(
  userId: string,
  data: any,
): Promise<ApiResponse<any>> {
  try {
    const { id, smtpServer, smtpPort, smtpUsername, smtpPassword, fromEmail } =
      emailConfigSchema.parse(data);

    // 检查域名是否存在且已验证
    const domainResult = await getUserCustomDomainById(userId, id);
    if (domainResult.status === "error" || !domainResult.data) {
      return { status: "error", message: "域名不存在" };
    }

    const domain = domainResult.data;
    if (!domain.isVerified) {
      return { status: "error", message: "请先验证域名所有权后再配置邮箱服务" };
    }

    // 更新邮箱服务配置
    const result = await prisma.$queryRaw`
      UPDATE user_custom_domains
      SET 
        "smtpServer" = ${smtpServer},
        "smtpPort" = ${smtpPort},
        "smtpUsername" = ${smtpUsername},
        "smtpPassword" = ${smtpPassword},
        "fromEmail" = ${fromEmail},
        "enableEmail" = true,
        updated_at = NOW()
      WHERE id = ${id} AND "userId" = ${userId}
      RETURNING *
    `;

    return {
      status: "success",
      data: Array.isArray(result) && result.length > 0 ? result[0] : null,
    };
  } catch (error) {
    logError("配置邮箱服务错误", error);
    return { status: "error", message: "配置邮箱服务失败" };
  }
}

// 验证邮箱配置
export async function verifyEmailConfiguration(
  userId: string,
  id: string,
): Promise<ApiResponse<any>> {
  try {
    // 获取域名信息
    const domainResult = await getUserCustomDomainById(userId, id);
    if (domainResult.status === "error" || !domainResult.data) {
      return { status: "error", message: "域名不存在" };
    }

    const domain = domainResult.data;

    // 检查是否已配置SMTP信息
    if (!domain.smtpServer || !domain.smtpUsername || !domain.smtpPassword) {
      return { status: "error", message: "请先配置SMTP服务信息" };
    }

    // 这里应该添加实际的邮箱测试逻辑
    // 例如：发送测试邮件并验证是否成功
    try {
      const testResult = await testEmailConfiguration(domain);
      if (!testResult.success) {
        return {
          status: "error",
          message: `邮箱配置验证失败: ${testResult.message}`,
          details: testResult.details,
        };
      }

      // 验证成功，更新状态
      const result = await prisma.$queryRaw`
        UPDATE user_custom_domains
        SET 
          "emailVerified" = true,
          updated_at = NOW()
        WHERE id = ${id} AND "userId" = ${userId}
        RETURNING *
      `;

      return {
        status: "success",
        data: Array.isArray(result) && result.length > 0 ? result[0] : null,
      };
    } catch (error) {
      return {
        status: "error",
        message: `邮箱配置测试失败: ${error.message || "未知错误"}`,
      };
    }
  } catch (error) {
    logError("验证邮箱配置错误", error);
    return { status: "error", message: "验证邮箱配置过程中发生错误" };
  }
}

// 测试邮箱配置
async function testEmailConfiguration(
  domain: any,
): Promise<{ success: boolean; message?: string; details?: any }> {
  try {
    // 这里实现发送测试邮件的逻辑
    // 使用node-mailer或其他邮件库发送测试邮件

    // 模拟测试过程
    logInfo(`测试邮箱配置: ${domain.smtpServer}:${domain.smtpPort}`);

    // TODO: 实现实际的邮件发送测试
    // 以下是一个模拟，实际实现需要使用正确的邮件库

    /*
    const nodemailer = require('nodemailer');
    
    // 创建邮件传输对象
    const transporter = nodemailer.createTransport({
      host: domain.smtpServer,
      port: domain.smtpPort,
      secure: domain.smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: domain.smtpUsername,
        pass: domain.smtpPassword,
      },
    });
    
    // 发送测试邮件
    const info = await transporter.sendMail({
      from: domain.fromEmail,
      to: domain.smtpUsername, // 发送给自己作为测试
      subject: "邮箱配置测试",
      text: "这是一封测试邮件，用于验证您的邮箱配置是否正确。",
      html: "<b>这是一封测试邮件，用于验证您的邮箱配置是否正确。</b>",
    });

    console.log("邮件发送成功:", info.messageId);
    */

    // 模拟成功
    return { success: true };
  } catch (error) {
    logError("测试邮箱配置错误", error);
    return {
      success: false,
      message: `邮箱测试失败: ${error.message || "未知错误"}`,
      details: { error: String(error) },
    };
  }
}

// 验证邮箱DNS记录 (MX, SPF, DKIM, DMARC)
export async function verifyEmailDNSRecords(
  userId: string,
  id: string,
): Promise<ApiResponse<any>> {
  try {
    const domainResult = await getUserCustomDomainById(userId, id);
    if (domainResult.status === "error" || !domainResult.data) {
      return { status: "error", message: "域名不存在" };
    }

    const domain = domainResult.data;
    const domainName = domain.domainName;

    // 验证MX记录
    const mxResult = await verifyMXRecords(domainName);
    if (!mxResult.success) {
      return {
        status: "error",
        message: `MX记录验证失败: ${mxResult.message}`,
        details: mxResult.details,
      };
    }

    // 验证SPF记录
    const spfResult = await verifySPFRecord(domainName);
    if (!spfResult.success) {
      return {
        status: "error",
        message: `SPF记录验证失败: ${spfResult.message}`,
        details: spfResult.details,
      };
    }

    // 验证DKIM记录
    const dkimResult = await verifyDKIMRecord(domainName);
    if (!dkimResult.success) {
      return {
        status: "error",
        message: `DKIM记录验证失败: ${dkimResult.message}`,
        details: dkimResult.details,
      };
    }

    // 验证DMARC记录
    const dmarcResult = await verifyDMARCRecord(domainName);
    if (!dmarcResult.success) {
      return {
        status: "error",
        message: `DMARC记录验证失败: ${dmarcResult.message}`,
        details: dmarcResult.details,
      };
    }

    return {
      status: "success",
      data: {
        mx: mxResult,
        spf: spfResult,
        dkim: dkimResult,
        dmarc: dmarcResult,
      },
    };
  } catch (error) {
    logError("验证邮箱DNS记录错误", error);
    return { status: "error", message: "验证邮箱DNS记录过程中发生错误" };
  }
}

// 验证MX记录
async function verifyMXRecords(
  domainName: string,
): Promise<DomainVerificationResult> {
  try {
    const resolveMx = promisify(dns.resolveMx);

    try {
      const mxRecords = await resolveMx(domainName);

      if (!mxRecords || mxRecords.length === 0) {
        return {
          success: false,
          message: "未找到MX记录，请添加MX记录以支持邮件收发",
          details: {
            recordType: "MX",
            lookupName: domainName,
          },
        };
      }

      return { success: true, details: { mxRecords } };
    } catch (dnsError: any) {
      return {
        success: false,
        message: `MX记录查询失败: ${dnsError.message || dnsError.code}`,
        details: {
          errorCode: dnsError.code,
          error: dnsError.message,
        },
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "验证MX记录过程中发生错误",
      details: { error: String(error) },
    };
  }
}

// 验证SPF记录
async function verifySPFRecord(
  domainName: string,
): Promise<DomainVerificationResult> {
  try {
    const resolveTxt = promisify(dns.resolveTxt);

    try {
      const txtRecords = await resolveTxt(domainName);

      // 查找SPF记录
      let spfRecord: string | null = null;
      for (const txtParts of txtRecords) {
        const txtValue = txtParts.join("");
        if (txtValue.startsWith("v=spf1")) {
          spfRecord = txtValue;
          break;
        }
      }

      if (!spfRecord) {
        return {
          success: false,
          message: "未找到SPF记录，请添加SPF记录以防止邮件被标记为垃圾邮件",
          details: {
            recordType: "TXT (SPF)",
            lookupName: domainName,
            recommendedValue: "v=spf1 include:_spf.yourmailserver.com ~all",
          },
        };
      }

      return { success: true, details: { spfRecord } };
    } catch (dnsError: any) {
      return {
        success: false,
        message: `SPF记录查询失败: ${dnsError.message || dnsError.code}`,
        details: {
          errorCode: dnsError.code,
          error: dnsError.message,
        },
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "验证SPF记录过程中发生错误",
      details: { error: String(error) },
    };
  }
}

// 验证DKIM记录
async function verifyDKIMRecord(
  domainName: string,
): Promise<DomainVerificationResult> {
  try {
    const resolveTxt = promisify(dns.resolveTxt);
    const selector = "default"; // 通常使用default或mail作为选择器
    const dkimRecordName = `${selector}._domainkey.${domainName}`;

    try {
      const txtRecords = await resolveTxt(dkimRecordName);

      if (!txtRecords || txtRecords.length === 0) {
        return {
          success: false,
          message: "未找到DKIM记录，请添加DKIM记录以提高邮件可信度",
          details: {
            recordType: "TXT (DKIM)",
            lookupName: dkimRecordName,
            selector,
            recommendedValue: "v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY",
          },
        };
      }

      // 检查DKIM记录格式
      const dkimValue = txtRecords[0].join("");
      if (!dkimValue.includes("v=DKIM1")) {
        return {
          success: false,
          message: "DKIM记录格式不正确，请确保包含v=DKIM1标识",
          details: {
            recordType: "TXT (DKIM)",
            lookupName: dkimRecordName,
            actualValue: dkimValue,
            recommendedFormat: "v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY",
          },
        };
      }

      return { success: true, details: { dkimRecord: dkimValue } };
    } catch (dnsError: any) {
      return {
        success: false,
        message: `DKIM记录查询失败: ${dnsError.message || dnsError.code}`,
        details: {
          errorCode: dnsError.code,
          error: dnsError.message,
        },
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "验证DKIM记录过程中发生错误",
      details: { error: String(error) },
    };
  }
}

// 验证DMARC记录
async function verifyDMARCRecord(
  domainName: string,
): Promise<DomainVerificationResult> {
  try {
    const resolveTxt = promisify(dns.resolveTxt);
    const dmarcRecordName = `_dmarc.${domainName}`;

    try {
      const txtRecords = await resolveTxt(dmarcRecordName);

      if (!txtRecords || txtRecords.length === 0) {
        return {
          success: false,
          message: "未找到DMARC记录，请添加DMARC记录以提高邮件安全性",
          details: {
            recordType: "TXT (DMARC)",
            lookupName: dmarcRecordName,
            recommendedValue:
              "v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com",
          },
        };
      }

      // 检查DMARC记录格式
      const dmarcValue = txtRecords[0].join("");
      if (!dmarcValue.includes("v=DMARC1")) {
        return {
          success: false,
          message: "DMARC记录格式不正确，请确保包含v=DMARC1标识",
          details: {
            recordType: "TXT (DMARC)",
            lookupName: dmarcRecordName,
            actualValue: dmarcValue,
            recommendedFormat:
              "v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com",
          },
        };
      }

      return { success: true, details: { dmarcRecord: dmarcValue } };
    } catch (dnsError: any) {
      return {
        success: false,
        message: `DMARC记录查询失败: ${dnsError.message || dnsError.code}`,
        details: {
          errorCode: dnsError.code,
          error: dnsError.message,
        },
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "验证DMARC记录过程中发生错误",
      details: { error: String(error) },
    };
  }
}

// 获取邮箱服务状态
export async function getEmailServiceStatus(
  userId: string,
  id: string,
): Promise<ApiResponse<any>> {
  try {
    const domainResult = await getUserCustomDomainById(userId, id);
    if (domainResult.status === "error" || !domainResult.data) {
      return { status: "error", message: "域名不存在" };
    }

    const domain = domainResult.data;

    if (!domain.enableEmail) {
      return {
        status: "success",
        data: {
          enabled: false,
          message: "邮箱服务未启用",
        },
      };
    }

    // 验证所有必要的DNS记录
    const dnsStatus = await verifyEmailDNSRecords(userId, id);

    return {
      status: "success",
      data: {
        enabled: domain.enableEmail,
        verified: domain.emailVerified,
        smtpConfigured: !!domain.smtpServer,
        dnsStatus: dnsStatus.status === "success" ? dnsStatus.data : null,
        dnsError: dnsStatus.status === "error" ? dnsStatus.message : null,
      },
    };
  } catch (error) {
    logError("获取邮箱服务状态错误", error);
    return { status: "error", message: "获取邮箱服务状态失败" };
  }
}
