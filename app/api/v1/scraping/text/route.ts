import cheerio from "cheerio";

import { checkApiKey } from "@/lib/dto/api-key";
import { createScrapeMeta } from "@/lib/dto/scrape";
import { getIpInfo, isLink } from "@/lib/utils";

export const revalidate = 600;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const link = url.searchParams.get("url");
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

    const res = await fetch(link);
    if (!res.ok) {
      return Response.json(
        { statusText: "获取 URL 失败" },
        {
          status: 405,
        },
      );
    }

    const html = await res.text();

    const $ = cheerio.load(html);

    // 移除所有 HTML 标签，只保留文本
    $("script").remove();
    $("style").remove();
    const text = $("body").text().trim();

    const stats = getIpInfo(req);
    await createScrapeMeta({
      ip: stats.ip,
      type: "text",
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

    return Response.json({
      url: link,
      content: text,
      format: "text",
      timestamp: Date.now(),
      payload: `https://kedaya.xyz/api/v1/scraping/text?url=${link}&key=${custom_apiKey}`,
    });
  } catch (error) {
    console.log(error);
    return Response.json(
      { statusText: "服务器错误" },
      {
        status: 500,
      },
    );
  }
}
