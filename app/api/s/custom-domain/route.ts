import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { errorResponse, successResponse } from "@/lib/api-response";

// 自定义域名短链接请求验证模式
const customDomainLinkSchema = z.object({
  userId: z.string(),
  customDomain: z.string(),
  slug: z.string().optional(),
  referer: z.string().optional(),
  ip: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  flag: z.string().optional(),
  lang: z.string().optional(),
  device: z.string().optional(),
  browser: z.string().optional(),
  password: z.string().optional()
});

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
      referer = "(None)",
      ip = "127.0.0.1",
      password = "",
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
        // 检查用户是否存在
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true }
        });
        
        if (!user) {
          logger.warn(`用户不存在: ${userId}`);
          return NextResponse.json("Missing[0000]");
        }
        
        // 创建默认短链接，指向系统首页
        userUrl = await prisma.userUrl.create({
          data: {
            userId: userId,
            userName: user.name || '未知用户',
            target: process.env.NEXT_PUBLIC_APP_URL || 'https://apil.top',
            url: customDomain, // 使用域名作为唯一标识
            prefix: customDomain,
            visible: 0,
            active: 1
          }
        });
        
        logger.info(`已创建默认域名短链接: ${customDomain}`, { userId });
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
    
    // 如果找不到短链接或已过期
    if (!userUrl) {
      logger.warn(`找不到有效的短链接: ${slug}`, { userId, customDomain });
      return NextResponse.json("Missing[0000]");
    }
    
    // 检查短链接是否过期
    if (userUrl.expiration !== "-1") {
      const expirationTimestamp = parseInt(userUrl.expiration);
      if (!isNaN(expirationTimestamp) && expirationTimestamp < Date.now()) {
        logger.info(`短链接已过期: ${slug}`, { userId, customDomain });
        return NextResponse.json("Expired[0001]");
      }
    }
    
    // 检查密码保护
    if (userUrl.password && userUrl.password !== password) {
      logger.info(`短链接需要密码: ${slug}`, { userId, customDomain });
      return NextResponse.json("PasswordRequired[0004]");
    }
    
    // 更新点击统计
    try {
      await prisma.urlMeta.upsert({
        where: {
          urlId_ip: {
            urlId: userUrl.id,
            ip
          }
        },
        update: {
          click: { increment: 1 },
          // 更新附加统计数据
          city: trackingData.city || null,
          country: trackingData.country || null,
          region: trackingData.region || null,
          latitude: trackingData.latitude || null,
          longitude: trackingData.longitude || null,
          referer: referer || null,
          lang: trackingData.lang || null,
          device: trackingData.device || null,
          browser: trackingData.browser || null
        },
        create: {
          urlId: userUrl.id,
          click: 1,
          ip,
          city: trackingData.city || null,
          country: trackingData.country || null,
          region: trackingData.region || null,
          latitude: trackingData.latitude || null,
          longitude: trackingData.longitude || null,
          referer: referer || null,
          lang: trackingData.lang || null,
          device: trackingData.device || null,
          browser: trackingData.browser || null
        }
      });
      
      logger.info(`短链接访问成功: ${slug} -> ${userUrl.target}`, { 
        userId, 
        customDomain,
        target: userUrl.target
      });
    } catch (error) {
      // 统计记录失败不影响重定向
      logger.error(`统计记录失败: ${slug}`, { error });
    }
    
    // 返回目标URL
    return NextResponse.json(userUrl.target);
  } catch (error) {
    logger.error("处理自定义域名短链接失败", { error });
    return NextResponse.json("Error[0003]");
  }
} 