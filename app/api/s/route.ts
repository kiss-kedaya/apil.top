import { NextRequest } from "next/server";
import { z } from "zod";

import { cacheService } from "@/lib/cache-service";
import { createUserShortUrlMeta, getUrlBySuffix } from "@/lib/dto/short-urls";
import { logger } from "@/lib/logger";

// 验证请求的Schema
const shortUrlRequestSchema = z.object({
  slug: z.string().min(1, "短链接标识不能为空"),
  referer: z.string().default("(None)"),
  ip: z.string().default("127.0.0.1"),
  city: z.string().optional().default(""),
  region: z.string().optional().default(""),
  country: z.string().optional().default(""),
  latitude: z.string().optional().default(""),
  longitude: z.string().optional().default(""),
  flag: z.string().optional().default(""),
  lang: z.string().optional().default(""),
  device: z.string().optional().default("Unknown"),
  browser: z.string().optional().default("Unknown"),
  password: z.string().optional().default(""),
});

/**
 * 检查短链接是否过期
 * @param shortUrl 短链接对象
 * @returns 是否过期
 */
function isShortUrlExpired(shortUrl: any): boolean {
  if (shortUrl.expiration === "-1") {
    return false; // 永不过期
  }
  
  const now = Date.now();
  const createdAt = new Date(shortUrl.updatedAt).getTime();
  const expirationMilliseconds = Number(shortUrl.expiration) * 1000;
  const expirationTime = createdAt + expirationMilliseconds;

  return now > expirationTime;
}

/**
 * 从缓存中获取短链接，如果缓存中不存在则从数据库查询
 * @param slug 短链接标识
 * @returns 短链接对象或null
 */
async function getCachedShortUrl(slug: string) {
  const cacheKey = `shortUrl:${slug}`;
  
  return await cacheService.getOrSet(
    cacheKey,
    async () => {
      const shortUrl = await getUrlBySuffix(slug);
      return shortUrl || null;
    },
    // 活跃的短链接缓存30秒，不活跃的缓存5分钟
    shortUrl => shortUrl?.active === 1 ? 30 * 1000 : 5 * 60 * 1000
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // 验证输入数据
    const validationResult = shortUrlRequestSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("无效的短链接请求", { 
        error: validationResult.error.message,
        requestData: body
      });
      return Response.json("Missing[0000]");
    }
    
    const data = validationResult.data;

    // 查询短链接 - 使用缓存
    const shortUrl = await getCachedShortUrl(data.slug);
    
    // 短链接不存在
    if (!shortUrl) {
      logger.info(`短链接不存在: ${data.slug}`);
      return Response.json("Missing[0000]");
    }

    // 短链接未激活
    if (shortUrl.active !== 1) {
      logger.info(`短链接未激活: ${data.slug}`);
      return Response.json("Disabled[0002]");
    }

    // 密码验证
    if (shortUrl.password && shortUrl.password !== "") {
      if (!data.password) {
        logger.info(`短链接需要密码: ${data.slug}`);
        return Response.json("PasswordRequired[0004]");
      }
      if (data.password !== shortUrl.password) {
        logger.info(`短链接密码错误: ${data.slug}`);
        return Response.json("IncorrectPassword[0005]");
      }
    }

    // 过期验证
    if (isShortUrlExpired(shortUrl)) {
      logger.info(`短链接已过期: ${data.slug}`);
      return Response.json("Expired[0001]");
    }

    // 创建访问记录 - 异步处理，不阻塞响应
    try {
      // 我们不再等待统计记录的完成
      createUserShortUrlMeta({
        urlId: shortUrl.id,
        click: 1,
        ip: data.ip ? data.ip.split(",")[0] : "127.0.0.1",
        city: data.city,
        region: data.region,
        country: data.country,
        latitude: data.latitude,
        longitude: data.longitude,
        referer: data.referer,
        lang: data.lang,
        device: data.device,
        browser: data.browser,
      });
    } catch (error) {
      // 统计错误不影响用户体验，只记录日志
      logger.error("创建短链接访问记录失败", { 
        error, 
        urlId: shortUrl.id,
        slug: data.slug 
      });
    }

    // 成功 - 返回目标URL
    return Response.json(shortUrl.target);
  } catch (error) {
    logger.error("短链接API处理错误", { error });
    return Response.json("Error[0003]");
  }
}
