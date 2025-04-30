import { env } from "@/env.mjs";
import { checkApiKey } from "@/lib/dto/api-key";
import { createScrapeMeta } from "@/lib/dto/scrape";
import { getIpInfo, isLink } from "@/lib/utils";

export const revalidate = 60;

// export const runtime = "edge";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const link = url.searchParams.get("url");
    const full = url.searchParams.get("full") || "false";
    const width = url.searchParams.get("width") || "1200";
    const height = url.searchParams.get("height") || "750";
    const viewportWidth = url.searchParams.get("viewportWidth") || "1200";
    const viewportHeight = url.searchParams.get("viewportHeight") || "750";
    const forceReload = url.searchParams.get("forceReload") || "false";
    const isMobile = url.searchParams.get("isMobile") || "false";
    const isDarkMode = url.searchParams.get("isDarkMode") || "false";
    const deviceScaleFactor = url.searchParams.get("deviceScaleFactor") || "1";

    // 检查 URL 是否有效
    if (!link || !isLink(link)) {
      return Response.json(
        { statusText: "URL 是必需的" },
        {
          status: 400,
        },
      );
    }

    // 从请求中获取 API 密钥
    const custom_apiKey = url.searchParams.get("key");
    if (!custom_apiKey) {
      return Response.json(
        {
          statusText:
            "API 密钥是必需的。您可以从仪表盘->设置中获取您的 API 密钥。",
        },
        { status: 400 },
      );
    }

    // 检查 API 密钥是否有效
    const user_apiKey = await checkApiKey(custom_apiKey);
    if (!user_apiKey?.id) {
      return Response.json(
        {
          statusText:
            "无效的 API 密钥。您可以从仪表盘->设置中获取您的 API 密钥。",
        },
        { status: 401 },
      );
    }

    const { SCREENSHOTONE_BASE_URL } = env;
    const scrape_url = `${SCREENSHOTONE_BASE_URL}?url=${link}&isFullPage=${full}&width=${width}&height=${height}&viewportWidth=${viewportWidth}&viewportHeight=${viewportHeight}&forceReload=${forceReload}&isMobile=${isMobile}&isDarkMode=${isDarkMode}&deviceScaleFactor=${deviceScaleFactor}`;
    // console.log("[抓取 URL]", scrape_url);

    const res = await fetch(scrape_url);
    if (!res.ok) {
      return Response.json(
        { statusText: "获取截图失败" },
        {
          status: 406,
        },
      );
    }

    const stats = getIpInfo(req);
    await createScrapeMeta({
      ip: stats.ip,
      type: "screenshot",
      referer: stats.referer,
      city: stats.city,
      region: stats.region,
      country: stats.country,
      latitude: stats.latitude,
      longitude: stats.longitude,
      lang: stats.lang,
      device: stats.device,
      browser: stats.browser,
      click: 1,
      userId: user_apiKey.id,
      apiKey: custom_apiKey,
      link,
    });

    const imageBuffer = await res.arrayBuffer();
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (error) {
    return Response.json({ statusText: "服务器错误" }, { status: 500 });
  }
}
