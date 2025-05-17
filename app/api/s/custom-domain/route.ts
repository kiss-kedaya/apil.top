import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { errorResponse } from "@/lib/api-response";
import { env } from "@/env.mjs";

// 自定义域名短链接请求验证模式
const customDomainLinkSchema = z.object({
  userId: z.string(),
  customDomain: z.string(),
  slug: z.string().optional(),
  referer: z.string().default("(None)"),
  ip: z.string().default("127.0.0.1"),
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  flag: z.string().optional(),
  lang: z.string().optional(),
  device: z.string().optional(),
  browser: z.string().optional(),
  password: z.string().default("")
});

/**
 * 检查短链接是否过期
 * @param shortUrl 短链接对象
 * @returns 是否过期
 */
async function isShortUrlExpired(shortUrl: any): Promise<boolean> {
  if (!shortUrl.expiration || shortUrl.expiration === "-1") {
    return false;
  }
  
  try {
    const expirationTimestamp = parseInt(shortUrl.expiration);
    return !isNaN(expirationTimestamp) && expirationTimestamp < Date.now();
  } catch (error) {
    await logger.error(`短链接过期检查错误: ${shortUrl.id}`, { error });
    return false; // 如果无法解析过期时间，默认为未过期
  }
}

/**
 * 更新短链接访问统计
 * @param urlId 短链接ID
 * @param trackingData 访问统计数据
 */
async function updateClickStatistics(urlId: string, trackingData: any): Promise<void> {
  const { ip, referer, ...otherData } = trackingData;
  
  try {
    await prisma.urlMeta.upsert({
      where: {
        urlId_ip: {
          urlId: urlId,
          ip
        }
      },
      update: {
        click: { increment: 1 },
        referer: referer || null,
        ...Object.entries(otherData).reduce((acc, [key, value]) => {
          acc[key] = value || null;
          return acc;
        }, {} as Record<string, any>)
      },
      create: {
        urlId: urlId,
        click: 1,
        ip,
        referer: referer || null,
        ...Object.entries(otherData).reduce((acc, [key, value]) => {
          acc[key] = value || null;
          return acc;
        }, {} as Record<string, any>)
      }
    });
    
    logger.info(`短链接访问统计更新成功: ${urlId}`);
  } catch (error) {
    // 统计记录失败不影响重定向
    await logger.error(`统计记录失败: ${urlId}`, { error });
  }
}

/**
 * 处理自定义域名的短链接请求
 */
export async function POST(request: NextRequest) {
  try {
    // 验证请求数据
    const body = await request.json();
    const validationResult = customDomainLinkSchema.safeParse(body);
    
    if (!validationResult.success) {
      return errorResponse(validationResult.error.message, 400);
    }
    
    const { 
      userId, 
      customDomain, 
      slug = customDomain,
      ...trackingData
    } = validationResult.data;
    
    logger.info(`处理自定义域名短链接请求: ${customDomain}/${slug}`, { 
      userId, 
      customDomain, 
      slug 
    });
    
    // 检查域名所有者和域名有效性
    const customDomainRecord = await prisma.userCustomDomain.findFirst({
      where: {
        userId: userId,
        domainName: customDomain,
        isVerified: true
      }
    });
    
    if (!customDomainRecord) {
      logger.warn(`找不到有效的自定义域名记录: ${customDomain}`, { userId });
      return NextResponse.json("Missing[0000]");
    }
    
    // 查找短链接
    let userUrl;
    
    if (slug === customDomain) {
      // 如果 slug 是域名本身，查找该用户的默认域名短链接
      userUrl = await prisma.userUrl.findFirst({
        where: {
          userId: userId,
          url: customDomain, // 使用域名作为唯一标识
          active: 1
        }
      });
      
      // 如果没有找到，尝试创建一个默认的域名短链接
      if (!userUrl) {
        userUrl = await createDefaultDomainShortUrl(userId, customDomain);
        if (!userUrl) {
          return NextResponse.json("Missing[0000]");
        }
      }
    } else {
      // 查找常规短链接
      userUrl = await prisma.userUrl.findFirst({
        where: {
          userId: userId,
          url: slug,
          active: 1
        }
      });
    }
    
    // 如果找不到短链接
    if (!userUrl) {
      logger.warn(`找不到有效的短链接: ${slug}`, { userId, customDomain });
      return NextResponse.json("Missing[0000]");
    }
    
    // 检查短链接是否过期
    if (await isShortUrlExpired(userUrl)) {
      logger.info(`短链接已过期: ${slug}`, { userId, customDomain });
      return NextResponse.json("Expired[0001]");
    }
    
    // 检查密码保护
    if (userUrl.password && userUrl.password !== trackingData.password) {
      logger.info(`短链接需要密码: ${slug}`, { userId, customDomain });
      return NextResponse.json("PasswordRequired[0004]");
    }
    
    // 更新点击统计
    updateClickStatistics(userUrl.id, trackingData);
    
    logger.info(`短链接访问成功: ${slug} -> ${userUrl.target}`, { 
      userId, 
      customDomain,
      target: userUrl.target
    });
    
    // 返回目标URL
    return NextResponse.json(userUrl.target);
  } catch (error) {
    await logger.error("处理自定义域名短链接失败", { error });
    return NextResponse.json("Error[0003]");
  }
}

/**
 * 创建默认的域名短链接
 * @param userId 用户ID
 * @param domainName 域名名称
 * @returns 创建的短链接对象，如果失败返回null
 */
async function createDefaultDomainShortUrl(userId: string, domainName: string) {
  try {
    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true }
    });
    
    if (!user) {
      logger.warn(`用户不存在: ${userId}`);
      return null;
    }
    
    // 创建默认短链接，指向系统首页
    const userUrl = await prisma.userUrl.create({
      data: {
        userId: userId,
        userName: user.name || '未知用户',
        target: env.NEXT_PUBLIC_APP_URL || 'https://qali.cn',
        url: domainName, // 使用域名作为唯一标识
        prefix: domainName,
        visible: 0,
        active: 1
      }
    });
    
    logger.info(`已创建默认域名短链接: ${domainName}`, { userId });
    return userUrl;
  } catch (error) {
    await logger.error(`创建默认域名短链接失败: ${domainName}`, { error, userId });
    return null;
  }
} 