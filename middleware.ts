import { NextResponse } from "next/server";
import { geolocation } from "@vercel/functions";
import { auth } from "auth";
import { NextAuthRequest } from "next-auth/lib";
import UAParser from "ua-parser-js";

import { siteConfig } from "./config/site";

// 扩展matcher规则，明确排除更多可能导致循环的路径
export const config = {
  matcher: [
    // 排除常见的静态资源和API路径
    "/((?!api|_next|static|images|docs|favicon.ico).*)",
    // 排除所有带有扩展名的文件
    "/((?!.*\\..*).+)"
  ],
};

const redirectMap = {
  "Missing[0000]": "/docs/short-urls#missing-links",
  "Expired[0001]": "/docs/short-urls#expired-links",
  "Disabled[0002]": "/docs/short-urls#disabled-links",
  "Error[0003]": "/docs/short-urls#error-links",
  "PasswordRequired[0004]": "/password-prompt?error=0&slug=",
  "IncorrectPassword[0005]": "/password-prompt?error=1&slug=",
};

// 提取短链接处理逻辑
async function handleShortUrl(req: NextAuthRequest) {
  try {
    // 只处理短链接请求，其他URL模式直接放行
    if (!req.url.includes("/s/")) return NextResponse.next();

    const slug = extractSlug(req.url);
    if (!slug)
      return NextResponse.redirect(`/docs/short-urls`, 302);

    // 安全获取地理位置信息，防止undefined错误
    let geo;
    try {
      geo = geolocation(req);
    } catch (error) {
      console.error("Geolocation error:", error);
      geo = {}; // 使用空对象作为备选
    }

    const headers = req.headers;
    const { browser, device } = parseUserAgent(headers.get("user-agent") || "");

    const url = new URL(req.url);
    const password = url.searchParams.get("password") || "";

    const trackingData = {
      slug,
      referer: headers.get("referer") || "(None)",
      ip: headers.get("X-Forwarded-For") || "127.0.0.1",
      city: geo?.city || "",
      region: geo?.region || "",
      country: geo?.country || "",
      latitude: geo?.latitude || "",
      longitude: geo?.longitude || "",
      flag: geo?.flag || "",
      lang: headers.get("accept-language")?.split(",")[0] || "",
      device: device.model || "Unknown",
      browser: browser.name || "Unknown",
      password,
    };

    // 构建api请求的完整URL
    const apiUrl = new URL("/api/s", req.url);
    
    try {
      const res = await fetch(apiUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trackingData),
      });

      if (!res.ok)
        return NextResponse.redirect(
          `${redirectMap["Error[0003]"]}`,
          302,
        );

      const target = await res.json();

      // 处理直接返回字符串的情况
      if (typeof target === "string") {
        // 检查是否是预定义的重定向
        if (target in redirectMap) {
          if (
            ["PasswordRequired[0004]", "IncorrectPassword[0005]"].includes(
              target,
            )
          ) {
            return NextResponse.redirect(
              `${redirectMap[target]}${slug}`,
              302,
            );
          }

          return NextResponse.redirect(
            `${redirectMap[target]}`,
            302,
          );
        }

        // 否则将target作为URL直接重定向
        return NextResponse.redirect(target, 302);
      }
      
      // 兼容旧格式的响应
      if (target && typeof target === "object") {
        if (target.message && target.message in redirectMap) {
          if (
            ["PasswordRequired[0004]", "IncorrectPassword[0005]"].includes(
              target.message,
            )
          ) {
            return NextResponse.redirect(
              `${redirectMap[target.message]}${slug}`,
              302,
            );
          }

          return NextResponse.redirect(
            `${redirectMap[target.message]}`,
            302,
          );
        }

        if (target.target && typeof target.target === "string") {
          return NextResponse.redirect(target.target, 302);
        }
      }

      // 如果无法解析响应
      return NextResponse.redirect(
        `${redirectMap["Error[0003]"]}`,
        302,
      );
    } catch (error) {
      console.error("API fetch error:", error);
      return NextResponse.redirect(`${redirectMap["Error[0003]"]}`, 302);
    }
  } catch (error) {
    console.error("Short URL handling error:", error);
    return NextResponse.redirect(`${redirectMap["Error[0003]"]}`, 302);
  }
}

// 提取 slug
function extractSlug(url: string): string | null {
  try {
    const match = url.match(/([^/?]+)(?:\?.*)?$/);
    return match ? match[1] : null;
  } catch (error) {
    console.error("Extract slug error:", error);
    return null;
  }
}

// 解析用户代理
const parser = new UAParser();
function parseUserAgent(ua: string) {
  try {
    parser.setUA(ua);
    return {
      browser: parser.getBrowser() || { name: "Unknown" },
      device: parser.getDevice() || { model: "Unknown" },
    };
  } catch (error) {
    console.error("Parse user agent error:", error);
    return {
      browser: { name: "Unknown" },
      device: { model: "Unknown" },
    };
  }
}

export default auth(async (req) => {
  try {
    // 首先检查URL是否是短链接路径，如果不是则直接放行
    if (!req.url.includes("/s/")) {
      return NextResponse.next();
    }
    
    // 处理短链接
    return await handleShortUrl(req);
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.redirect("/", 302);
  }
});
