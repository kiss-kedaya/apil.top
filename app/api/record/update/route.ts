import { env } from "@/env.mjs";
import { updateDNSRecord } from "@/lib/cloudflare";
import {
  updateUserRecord,
  updateUserRecordState,
} from "@/lib/dto/cloudflare-dns-record";
import { checkUserStatus } from "@/lib/dto/user";
import { reservedDomains } from "@/lib/enums";
import { getCurrentUser } from "@/lib/session";

// update record
export async function POST(req: Request) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;

    const {
      CLOUDFLARE_ZONE_ID,
      CLOUDFLARE_ZONE_NAME,
      CLOUDFLARE_API_KEY,
      CLOUDFLARE_EMAIL,
    } = env;
    if (
      !CLOUDFLARE_ZONE_ID ||
      !CLOUDFLARE_ZONE_NAME ||
      !CLOUDFLARE_API_KEY ||
      !CLOUDFLARE_EMAIL
    ) {
      return Response.json({ message: "API密钥和区域ID是必需的。" }, { status: 401 });
    }

    const { record, recordId } = await req.json();

    const record_name = record.name.endsWith(".apil.top")
      ? record.name
      : record.name + ".apil.top";
    if (reservedDomains.includes(record_name)) {
      return Response.json({ message: "域名已被保留" }, {
        status: 403,
      });
    }

    const data = await updateDNSRecord(
      CLOUDFLARE_ZONE_ID,
      CLOUDFLARE_API_KEY,
      CLOUDFLARE_EMAIL,
      recordId,
      record,
    );
    console.log("updateDNSRecord", data);

    if (!data.success || !data.result?.id) {
      return Response.json(data.errors, {
        status: 501,
      });
    } else {
      const res = await updateUserRecord(user.id, {
        record_id: data.result.id,
        zone_id: CLOUDFLARE_ZONE_ID,
        zone_name: CLOUDFLARE_ZONE_NAME,
        name: data.result.name,
        type: data.result.type,
        content: data.result.content,
        proxied: data.result.proxied,
        proxiable: data.result.proxiable,
        ttl: data.result.ttl,
        comment: data.result.comment ?? "",
        tags: data.result.tags?.join("") ?? "",
        modified_on: data.result.modified_on,
        active: 1,
      });
      if (res.status !== "success") {
        return Response.json({ message: res.status }, {
          status: 502,
        });
      }
      return Response.json(res.data);
    }
  } catch (error) {
    console.log(error);
    const errorMessage = typeof error === 'string' 
      ? { message: error } 
      : (error && typeof error === 'object' 
          ? { message: error.statusText || '服务器错误', ...error } 
          : { message: '服务器错误' });
    
    return Response.json(errorMessage, {
      status: error && typeof error === 'object' && 'status' in error ? error.status : 500
    });
  }
}

// update record state
export async function PUT(req: Request) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;

    const { CLOUDFLARE_ZONE_ID, CLOUDFLARE_API_KEY, CLOUDFLARE_EMAIL } = env;
    if (!CLOUDFLARE_ZONE_ID || !CLOUDFLARE_API_KEY || !CLOUDFLARE_EMAIL) {
      return Response.json({ message: "API密钥和区域ID是必需的。" }, {
        status: 401,
      });
    }

    const { zone_id, record_id, target, active } = await req.json();
    
    // 先检查目标是否可访问
    let isTargetAccessible = false;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒超时
      
      const target_res = await fetch(`https://${target}`, {
        method: 'HEAD',  // 使用HEAD请求减少数据传输
        headers: {
          'User-Agent': 'DNS-Check-Bot'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      isTargetAccessible = target_res.status === 200;
    } catch (fetchError) {
      isTargetAccessible = false;
      console.log(`无法访问目标: ${fetchError}`);
    }

    // 无论目标是否可访问，都允许用户设置状态
    // 根据用户的选择来设置状态，而不是以可访问性为准
    const res = await updateUserRecordState(
      user.id,
      record_id,
      zone_id,
      active // 使用用户传入的状态值
    );

    if (!res) {
      return Response.json({ message: "发生错误。" }, { status: 502 });
    }
    
    // 返回成功消息，并提供可访问性信息作为参考
    return Response.json({
      message: active ? 
        (isTargetAccessible ? "状态已开启，且目标可访问!" : "状态已开启，但目标不可访问!") : 
        "状态已关闭"
    });
  } catch (error) {
    console.error(error);
    const errorMessage = typeof error === 'string' 
      ? { message: error } 
      : (error && typeof error === 'object' 
          ? { message: error.statusText || '发生错误', ...error } 
          : { message: '发生错误' });
    
    return Response.json(errorMessage, {
      status: error && typeof error === 'object' && 'status' in error ? error.status : 500
    });
  }
}
