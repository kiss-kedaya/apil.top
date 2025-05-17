import { createScrapeMeta } from "@/lib/dto/scrape";
import { checkApiKey } from "@/lib/dto/api-key";
import { getIpInfo, isLink } from "@/lib/utils";
// 正确导入Jimp
import Jimp from "jimp";
// 继续使用ts-ignore忽略jsQR的类型错误
// @ts-ignore - 忽略jsQR的类型错误
import jsQR from "jsqr";
import fetch from "node-fetch";

export async function POST(req: Request) {
  try {
    let body;
    
    try {
      body = await req.json();
    } catch (error) {
      return Response.json(
        { statusText: "无效的请求体格式" },
        { status: 400 },
      );
    }
    
    const imageUrl = body.url;
    const base64Image = body.base64;

    // 必须传入url或base64中的一个
    if (!imageUrl && !base64Image) {
      return Response.json(
        { statusText: "必须提供图片URL或base64编码的图片" },
        { status: 400 },
      );
    }

    // 从请求中获取 API 密钥
    const custom_apiKey = body.key;
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

    let imageBuffer: Buffer | undefined;
    
    // 处理URL图片
    if (imageUrl) {
      if (!isLink(imageUrl)) {
        return Response.json(
          { statusText: "无效的图片URL" },
          { status: 400 },
        );
      }
      
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
          return Response.json(
            { statusText: "无法获取图片URL" },
            { status: 400 },
          );
        }
        imageBuffer = Buffer.from(await response.arrayBuffer());
      } catch (error) {
        return Response.json(
          { statusText: "获取图片URL失败" },
          { status: 400 },
        );
      }
    } 
    // 处理base64图片
    else if (base64Image) {
      try {
        // 处理可能包含的Data URL前缀
        const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg|gif|webp);base64,/, '');
        imageBuffer = Buffer.from(base64Data, 'base64');
      } catch (error) {
        return Response.json(
          { statusText: "无效的base64编码图片" },
          { status: 400 },
        );
      }
    }

    if (!imageBuffer) {
      return Response.json(
        { statusText: "处理图片数据失败" },
        { status: 400 },
      );
    }

    // 用Jimp加载图像
    // @ts-ignore - 忽略类型错误
    const image = await Jimp.read(imageBuffer);
    const { width, height } = image.bitmap;
    
    // 创建像素数组供jsQR使用
    const imageData = new Uint8ClampedArray(width * height * 4);
    
    let i = 0;
    image.scan(0, 0, width, height, function(x: number, y: number, idx: number) {
      imageData[i++] = this.bitmap.data[idx + 0]; // R
      imageData[i++] = this.bitmap.data[idx + 1]; // G
      imageData[i++] = this.bitmap.data[idx + 2]; // B
      imageData[i++] = this.bitmap.data[idx + 3]; // A
    });

    // 用jsQR解析二维码
    const qrCode = jsQR(imageData, width, height, {
      inversionAttempts: "dontInvert",
    });

    if (!qrCode) {
      return Response.json(
        { statusText: "未能在图片中检测到二维码" },
        { status: 400 },
      );
    }

    // 记录统计信息
    const stats = getIpInfo(req);
    await createScrapeMeta({
      ip: stats.ip,
      type: "qrcode-decode",
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
      link: imageUrl || "base64-image",
    });

    // 返回解析结果
    return Response.json({
      text: qrCode.data,
      location: qrCode.location,
    });
  } catch (error) {
    console.error("二维码解析错误:", error);
    return Response.json({ statusText: "服务器错误" }, { status: 500 });
  }
} 