import QRCode from "qrcode";

import { checkApiKey } from "@/lib/dto/api-key";
import { createScrapeMeta } from "@/lib/dto/scrape";
import { getIpInfo, isLink } from "@/lib/utils";

export const revalidate = 60;

// export const runtime = "edge";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const link = url.searchParams.get("url");
    const width = parseInt(url.searchParams.get("width") || "200");
    const margin = parseInt(url.searchParams.get("margin") || "4");
    const dark = url.searchParams.get("dark") || "#000000";
    const light = url.searchParams.get("light") || "#ffffff";
    const type = url.searchParams.get("type") || "png"; // png  | jpeg | webp | string

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

    let qrResult: any;
    if (type === "string") {
      qrResult = QRCode.toString(link);
    } else {
      qrResult = await QRCode.toDataURL(link, {
        width,
        margin,
        color: {
          dark,
          light,
        },
        errorCorrectionLevel: "H", // 可选: L, M, Q, H
        type:
          type === "png"
            ? "image/png"
            : type === "jepg"
              ? "image/jpeg"
              : "image/webp",
      });
    }

    const stats = getIpInfo(req);
    await createScrapeMeta({
      ip: stats.ip,
      type: "qrcode",
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

    return new Response(qrResult);
  } catch (error) {
    return Response.json({ statusText: "服务器错误" }, { status: 500 });
  }
}
