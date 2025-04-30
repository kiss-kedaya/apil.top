import { z } from "zod";

import { prisma } from "@/lib/db";

// 新增自定义域名验证
export const createCustomDomainSchema = z.object({
  domainName: z.string().min(1).max(100),
});

// 更新自定义域名验证
export const updateCustomDomainSchema = z.object({
  id: z.string().min(1),
  domainName: z.string().min(1).max(100),
  isVerified: z.boolean().optional(),
});

// 创建自定义域名
export async function createUserCustomDomain(userId: string, data: any) {
  try {
    const { domainName } = createCustomDomainSchema.parse(data);

    // 生成随机验证密钥
    const verificationKey = Array(16)
      .fill(0)
      .map(() => Math.random().toString(36).charAt(2))
      .join("");

    // 确保数据库中有user_custom_domains表
    try {
      const res =
        await prisma.$queryRaw`SELECT 1 FROM user_custom_domains LIMIT 1`;
    } catch (error) {
      // 如果表不存在，需要执行迁移
      console.error("自定义域名表可能不存在，请确保已运行迁移:", error);
      return { status: "error", message: "系统配置错误，请联系管理员" };
    }

    // 创建新的自定义域名记录
    const res = await prisma.$queryRaw`
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

    return { status: "success", data: Array.isArray(res) ? res[0] : res };
  } catch (error) {
    console.error("创建自定义域名错误:", error);
    return { status: "error", message: "创建自定义域名失败" };
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
    console.error("获取自定义域名列表错误:", error);
    return { status: "error", message: "获取自定义域名列表失败" };
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
    console.error("获取自定义域名详情错误:", error);
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
    console.error("删除自定义域名错误:", error);
    return { status: "error", message: "删除自定义域名失败" };
  }
}

// 更新自定义域名
export async function updateUserCustomDomain(userId: string, data: any) {
  try {
    const { id, domainName, isVerified } = updateCustomDomainSchema.parse(data);

    const result = await prisma.$queryRaw`
      UPDATE user_custom_domains
      SET 
        "domainName" = ${domainName},
        "isVerified" = ${isVerified !== undefined ? isVerified : false},
        updated_at = NOW()
      WHERE id = ${id} AND "userId" = ${userId}
      RETURNING *
    `;

    return {
      status: "success",
      data: Array.isArray(result) && result.length > 0 ? result[0] : null,
    };
  } catch (error) {
    console.error("更新自定义域名错误:", error);
    return { status: "error", message: "更新自定义域名失败" };
  }
}

// 验证自定义域名
export async function verifyUserCustomDomain(userId: string, id: string) {
  try {
    console.log(`开始验证用户域名: userId=${userId}, domainId=${id}`);
    
    const domainResult = await getUserCustomDomainById(userId, id);
    if (domainResult.status === "error" || !domainResult.data) {
      console.error(`域名不存在: userId=${userId}, domainId=${id}`);
      return { status: "error", message: "域名不存在" };
    }

    const domain = domainResult.data;
    console.log(`获取到域名信息: ${domain.domainName}, verificationKey=${domain.verificationKey}`);

    // 验证域名TXT记录
    const verificationResult = await verifyDomainDNS(domain);
    console.log(`验证结果:`, verificationResult);
    
    if (!verificationResult.success) {
      return {
        status: "error",
        message: `域名验证失败: ${verificationResult.message}`,
        details: verificationResult.details
      };
    }

    // 验证通过，更新域名状态
    console.log(`验证通过，更新域名状态为已验证`);
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
    console.error("验证自定义域名错误:", error);
    return { status: "error", message: "验证域名过程中发生错误" };
  }
}

// 验证域名TXT记录
async function verifyDomainDNS(domain: any) {
  try {
    // 构建需要验证的TXT记录名称
    const txtRecordName = `_kedaya.${domain.domainName}`;
    console.log(`验证DNS TXT记录: ${txtRecordName}`);

    // 通过DNS解析查询TXT记录
    const dnsResponse = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${txtRecordName}&type=TXT`,
      {
        headers: {
          Accept: "application/dns-json",
        },
      },
    );

    if (!dnsResponse.ok) {
      console.error(`DNS查询失败: status=${dnsResponse.status}`);
      return {
        success: false,
        message: `DNS查询失败，请稍后重试 (状态码: ${dnsResponse.status})`,
        details: { errorCode: dnsResponse.status }
      };
    }

    const dnsData = await dnsResponse.json();
    console.log(`DNS查询响应:`, dnsData);

    // 检查DNS响应是否包含TXT记录
    if (!dnsData.Answer || dnsData.Answer.length === 0) {
      console.error(`未找到TXT记录: ${txtRecordName}`);
      return {
        success: false,
        message: `未找到验证TXT记录，请确保您已添加TXT记录：【主机记录: _kedaya，记录值: ${domain.verificationKey}】`,
        details: {
          recordType: "TXT",
          host: "_kedaya",
          expectedValue: domain.verificationKey,
          lookupName: txtRecordName
        }
      };
    }

    // 检查TXT记录值是否匹配验证密钥
    console.log(`检查TXT记录值是否匹配验证密钥: ${domain.verificationKey}`);
    let foundValidKey = false;
    const recordValues = [];
    
    for (const answer of dnsData.Answer) {
      // TXT记录返回值通常包含引号，需要去除
      const txtValue = answer.data.replace(/"/g, "");
      recordValues.push(txtValue);
      
      console.log(`- 比较 DNS值="${txtValue}" 与 验证密钥="${domain.verificationKey}"`);
      if (txtValue === domain.verificationKey) {
        foundValidKey = true;
        console.log(`找到匹配的验证密钥!`);
        break;
      }
    }

    if (!foundValidKey) {
      console.error(`TXT记录验证失败，找不到匹配的验证密钥`);
      return {
        success: false,
        message: "TXT记录验证失败，请确保TXT记录值与系统生成的验证密钥完全一致",
        details: {
          expectedValue: domain.verificationKey,
          actualValues: recordValues,
          lookupName: txtRecordName
        }
      };
    }

    console.log(`域名验证成功!`);
    return { success: true };
  } catch (error) {
    console.error("域名DNS验证错误:", error);
    return { 
      success: false, 
      message: "验证过程中发生错误，请稍后重试",
      details: { error: String(error) }
    };
  }
}
