// 动态导入Jimp和jsQR
// @ts-ignore - 忽略jsQR的类型错误
import jsQR from "jsqr";

import { checkApiKey } from "@/lib/dto/api-key";
import { createScrapeMeta } from "@/lib/dto/scrape";
import { logger } from "@/lib/logger";
import { getIpInfo, isLink } from "@/lib/utils";

// 修改 node-fetch 导入方式，使用动态导入
// @ts-ignore - 暂时忽略类型错误
const fetch = (...args: [string, object?]) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// 不要使用错误的静态导入
// import * as JimpModule from "jimp/es";

export async function POST(req: Request) {
  try {
    let body;

    try {
      body = await req.json();
    } catch (error) {
      return Response.json({ statusText: "无效的请求体格式" }, { status: 400 });
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

    try {
      // 添加日志
      await logger.info("开始处理二维码图片请求", {
        hasUrl: !!imageUrl,
        hasBase64: !!base64Image,
      });

      let imageBuffer: Buffer;

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
          await logger.info("从URL加载图片成功", { url: imageUrl });
        } catch (error) {
          await logger.error("从URL加载图片失败", error);
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
          const base64Data = base64Image.replace(
            /^data:image\/(png|jpeg|jpg|gif|webp);base64,/,
            "",
          );
          imageBuffer = Buffer.from(base64Data, "base64");
          await logger.info("从Base64加载图片成功", {
            dataLength: base64Data.length,
          });
        } catch (error) {
          await logger.error("从Base64加载图片失败", error);
          return Response.json(
            { statusText: "无效的base64编码图片" },
            { status: 400 },
          );
        }
      } else {
        return Response.json(
          { statusText: "处理图片数据失败" },
          { status: 400 },
        );
      }

      // 使用Sharp处理图像
      const sharp = await import("sharp");
      const sharpImage = sharp.default(imageBuffer);

      // 获取图像元数据
      const metadata = await sharpImage.metadata();
      const width = metadata.width || 0;
      const height = metadata.height || 0;

      if (!width || !height) {
        await logger.error("无法获取图像尺寸", { metadata });
        return Response.json({ statusText: "图像处理失败" }, { status: 400 });
      }

      // 添加日志
      await logger.info("图片加载成功", { width, height });

      // 提取原始像素数据
      const rawData = await sharpImage.raw().toBuffer();

      // 创建像素数组供jsQR使用
      const imageData = new Uint8ClampedArray(width * height * 4);

      // 根据不同的通道数处理数据
      const channels = metadata.channels || 3;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pos = (y * width + x) * channels;
          const rgba = (y * width + x) * 4;

          if (channels === 3) {
            // RGB
            imageData[rgba] = rawData[pos]; // R
            imageData[rgba + 1] = rawData[pos + 1]; // G
            imageData[rgba + 2] = rawData[pos + 2]; // B
            imageData[rgba + 3] = 255; // A (不透明)
          } else if (channels === 4) {
            // RGBA
            imageData[rgba] = rawData[pos]; // R
            imageData[rgba + 1] = rawData[pos + 1]; // G
            imageData[rgba + 2] = rawData[pos + 2]; // B
            imageData[rgba + 3] = rawData[pos + 3]; // A
          } else if (channels === 1) {
            // 灰度图
            imageData[rgba] = rawData[pos]; // R = 灰度值
            imageData[rgba + 1] = rawData[pos]; // G = 灰度值
            imageData[rgba + 2] = rawData[pos]; // B = 灰度值
            imageData[rgba + 3] = 255; // A (不透明)
          }
        }
      }

      // 用jsQR解析二维码
      const qrCode = jsQR(imageData, width, height, {
        inversionAttempts: "dontInvert",
      });

      if (!qrCode) {
        await logger.warn("未能在图片中检测到二维码", {
          imageWidth: width,
          imageHeight: height,
          fromUrl: !!imageUrl,
        });
        return Response.json(
          { statusText: "未能在图片中检测到二维码" },
          { status: 400 },
        );
      }

      // 添加日志
      await logger.info("二维码解析成功", {
        dataLength: qrCode.data.length,
        hasLocation: !!qrCode.location,
      });

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

      // 返回解析结果，只返回文本内容
      return Response.json({
        text: qrCode.data,
      });
    } catch (error) {
      await logger.error("图片处理或二维码解析错误", error);
      return Response.json(
        { statusText: "图片处理或二维码解析失败" },
        { status: 500 },
      );
    }
  } catch (error) {
    // 确保记录错误后再响应
    await logger.error("二维码解析错误", error);
    return Response.json({ statusText: "服务器错误" }, { status: 500 });
  }
}
