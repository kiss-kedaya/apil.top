import { NextResponse } from "next/server";
import { geolocation } from "@vercel/functions";
import { auth } from "@/auth";
import { NextAuthRequest } from "next-auth/lib";
import UAParser from "ua-parser-js";

import { siteConfig } from "./config/site";
import { DomainService } from "./lib/domain-service";

// 匹配 /s/ 路径和自定义域名的根路径请求
export const config = {
  matcher: ["/s/:path*", "/"],
};

const redirectMap = {
  "Missing[0000]": "/docs/short-urls#missing-links",
  "Expired[0001]": "/docs/short-urls#expired-links",
  "Disabled[0002]": "/docs/short-urls#disabled-links",
  "Error[0003]": "/docs/short-urls#error-links",
  "PasswordRequired[0004]": "/password-prompt?error=0&slug=",
  "IncorrectPassword[0005]": "/password-prompt?error=1&slug=",
};

// 处理请求的主函数
export default auth(async (req) => {
  try {
    const url = new URL(req.url);
    const hostname = url.hostname;
    const path = url.pathname;
    
    // 检查是否为自定义域名
    const isMainDomain = siteConfig.mainDomains.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
    
    // 如果是主域名
    if (isMainDomain) {
      // 只处理 /s/ 路径，其他全部放行
      if (path.startsWith('/s/')) {
        return await handleShortUrl(req);
      }
      // 不是短链接路径，正常访问
      return NextResponse.next();
    } 
    // 处理自定义域名情况
    else {
      // 检查是否是已验证的自定义域名
      const domainInfo = await DomainService.resolveUrlForDomain(hostname);
      
      if (domainInfo) {
        // 如果是自定义域名根路径请求，视为短链接请求
        if (path === '/' || path === '') {
          // 使用域名作为短链接前缀
          return await handleCustomDomainShortUrl(req, domainInfo.userId, hostname);
        }
        
        // 对于自定义域名的路径请求，也处理为短链接
        // 示例: custom.domain/abc -> 相当于 /s/abc
        const slug = path.substring(1); // 移除开头的斜杠
        if (slug) {
          return await handleCustomDomainShortUrl(req, domainInfo.userId, hostname, slug);
        }
      }
      
      // 未识别的自定义域名，正常放行
      return NextResponse.next();
    }
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.redirect("/", 302);
  }
});

// 处理自定义域名的短链接请求
async function handleCustomDomainShortUrl(req: NextAuthRequest, userId: string, hostname: string, slug?: string) {
  try {
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
      userId,      // 加入域名所有者ID
      customDomain: hostname, // 加入自定义域名信息
      slug: slug || hostname, // 如果没有提供slug，使用域名作为slug
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

    // 构建专用于自定义域名的API路径
    const apiUrl = new URL(`${siteConfig.url}/api/s/custom-domain`, req.url);
    
    try {
      const res = await fetch(apiUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trackingData),
      });

      if (!res.ok)
        return NextResponse.redirect(
          `${siteConfig.url}${redirectMap["Error[0003]"]}`,
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
              `${siteConfig.url}${redirectMap[target]}${slug || ''}`,
              302,
            );
          }

          return NextResponse.redirect(
            `${siteConfig.url}${redirectMap[target]}`,
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
              `${siteConfig.url}${redirectMap[target.message]}${slug || ''}`,
              302,
            );
          }

          return NextResponse.redirect(
            `${siteConfig.url}${redirectMap[target.message]}`,
            302,
          );
        }

        if (target.target && typeof target.target === "string") {
          return NextResponse.redirect(target.target, 302);
        }
      }

      // 如果无法解析响应
      return NextResponse.redirect(
        `${siteConfig.url}${redirectMap["Error[0003]"]}`,
        302,
      );
    } catch (error) {
      console.error("API fetch error:", error);
      return NextResponse.redirect(`${siteConfig.url}${redirectMap["Error[0003]"]}`, 302);
    }
  } catch (error) {
    console.error("Custom domain short URL handling error:", error);
    return NextResponse.redirect(`${siteConfig.url}${redirectMap["Error[0003]"]}`, 302);
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

// 提取短链接处理逻辑
async function handleShortUrl(req: NextAuthRequest) {
  try {
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
