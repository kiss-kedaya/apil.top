import cheerio from "cheerio";

import { checkApiKey } from "@/lib/dto/api-key";
import { createScrapeMeta } from "@/lib/dto/scrape";
import { getIpInfo, isLink, removeUrlSuffix } from "@/lib/utils";

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
    // console.log(html);

    const $ = cheerio.load(html);
    const title =
      $("title").text() ||
      $("meta[property='og:title']").attr("content") ||
      $("meta[name='twitter:title']").attr("content");
    const description =
      $("meta[name='description']").attr("content") ||
      $("meta[property='og:description']").attr("content") ||
      $("meta[name='twitter:description']").attr("content");
    const image =
      $("meta[property='og:image']").attr("content") ||
      $("meta[name='og:image']").attr("content") ||
      $("meta[property='twitter:image']").attr("content") ||
      $("meta[name='twitter:image']").attr("content");
    const icon =
      $("link[rel='icon']").attr("href") ||
      $("link[rel='apple-touch-icon']").attr("href") ||
      `https://icon.qali.cn/${removeUrlSuffix(link)}.ico`;
    const lang =
      $("html").attr("lang") ||
      $("html").attr("xml:lang") ||
      $("body").attr("lang") ||
      $("body").attr("xml:lang");
    const author =
      $("meta[name='author']").attr("content") ||
      $("meta[property='author']").attr("content");

    const stats = getIpInfo(req);
    await createScrapeMeta({
      ip: stats.ip,
      type: "meta-info",
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
      title,
      description,
      image,
      icon,
      url: link,
      lang,
      author,
      timestamp: Date.now(),
      payload: `https://qali.cn/api/v1/scraping/meta?url=${link}&key=${custom_apiKey}`,
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
