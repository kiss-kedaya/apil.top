import { NextRequest } from "next/server";

import { createUserShortUrlMeta, getUrlBySuffix } from "@/lib/dto/short-urls";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // 确保所有字段都有默认值
    const {
      slug = "",
      referer = "(None)",
      ip = "127.0.0.1",
      city = "",
      region = "",
      country = "",
      latitude = "",
      longitude = "",
      lang = "",
      device = "Unknown",
      browser = "Unknown",
      password = "",
    } = body;

    if (!slug) {
      return Response.json("Missing[0000]");
    }

    // 查询短链接
    const res = await getUrlBySuffix(slug);
    if (!res) {
      return Response.json("Disabled[0002]");
    }

    if (res.active !== 1) {
      return Response.json("Disabled[0002]");
    }

    // 密码验证
    if (res.password && res.password !== "") {
      if (!password) {
        return Response.json("PasswordRequired[0004]");
      }
      if (password !== res.password) {
        return Response.json("IncorrectPassword[0005]");
      }
    }

    // 过期验证
    const now = Date.now();
    const createdAt = new Date(res.updatedAt).getTime();
    const expirationMilliseconds = Number(res.expiration) * 1000;
    const expirationTime = createdAt + expirationMilliseconds;

    if (res.expiration !== "-1" && now > expirationTime) {
      return Response.json("Expired[0001]");
    }

    // 创建访问记录
    try {
      await createUserShortUrlMeta({
        urlId: res.id,
        click: 1,
        ip: ip ? ip.split(",")[0] : "127.0.0.1",
        city,
        region,
        country,
        latitude,
        longitude,
        referer,
        lang,
        device,
        browser,
      });
    } catch (error) {
      console.error("Failed to create short URL meta:", error);
      // 即使记录失败也继续执行
    }

    return Response.json(res.target);
  } catch (error) {
    console.error("Error in short URL API:", error);
    return Response.json("Error[0003]");
  }
}
