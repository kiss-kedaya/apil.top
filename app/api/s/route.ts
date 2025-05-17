import { NextRequest } from "next/server";
import { z } from "zod";

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // 验证输入数据
    const validationResult = shortUrlRequestSchema.safeParse(body);
    if (!validationResult.success) {
      logger.error("Invalid short URL request:", validationResult.error.message);
      return Response.json("Missing[0000]");
    }
    
    const data = validationResult.data;

    // 查询短链接
    const shortUrl = await getUrlBySuffix(data.slug);
    if (!shortUrl) {
      return Response.json("Missing[0000]");
    }

    if (shortUrl.active !== 1) {
      return Response.json("Disabled[0002]");
    }

    // 密码验证
    if (shortUrl.password && shortUrl.password !== "") {
      if (!data.password) {
        return Response.json("PasswordRequired[0004]");
      }
      if (data.password !== shortUrl.password) {
        return Response.json("IncorrectPassword[0005]");
      }
    }

    // 过期验证
    if (isShortUrlExpired(shortUrl)) {
      return Response.json("Expired[0001]");
    }

    // 创建访问记录
    try {
      await createUserShortUrlMeta({
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
      logger.error("Failed to create short URL meta:", error);
      // 即使记录失败也继续执行
    }

    return Response.json(shortUrl.target);
  } catch (error) {
    logger.error("Error in short URL API:", error);
    return Response.json("Error[0003]");
  }
}

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
