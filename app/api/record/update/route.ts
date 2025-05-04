import { env } from "@/env.mjs";
import {
  updateDNSRecord,
  deleteDNSRecord,
  createDNSRecord,
  DNSRecordResponse
} from "@/lib/cloudflare";
import {
  updateUserRecord,
  updateUserRecordState,
} from "@/lib/dto/cloudflare-dns-record";
import { checkUserStatus } from "@/lib/dto/user";
import { reservedDomains } from "@/lib/enums";
import { getCurrentUser } from "@/lib/session";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const prisma = new PrismaClient();

// 定义请求参数验证模式
const updateParamsSchema = z.object({
  zone_id: z.string(),
  record_id: z.string(),
  active: z.number().optional(),
  proxied: z.boolean().optional(),
  target: z.string().optional(),
});

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

/**
 * 处理DNS记录更新请求
 */
export async function PUT(request: Request) {
  try {
    // 验证用户会话
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "未授权访问" },
        { status: 401 }
      );
    }

    // 解析请求参数
    const body = await request.json();
    const validation = updateParamsSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "参数验证失败", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { zone_id, record_id, active, proxied, target } = validation.data;

    // 查询用户记录
    const userRecord = await prisma.userRecord.findFirst({
      where: {
        record_id: record_id,
        zone_id: zone_id,
        user: {
          email: session.user.email,
        },
      },
    });

    if (!userRecord) {
      return NextResponse.json(
        { error: "记录不存在或无权访问" },
        { status: 404 }
      );
    }

    // 获取用户API密钥信息
    const keyRecord = await prisma.user.findUnique({
      where: {
        id: userRecord.userId,
      },
      select: {
        email: true,
        cloudflareApiKey: true,
      }
    });

    if (!keyRecord?.cloudflareApiKey) {
      return NextResponse.json(
        { error: "用户API密钥未配置" },
        { status: 400 }
      );
    }

    const cf_email = keyRecord.email;
    const cf_key = keyRecord.cloudflareApiKey;

    let response: DNSRecordResponse | undefined;
    let message = "";

    // 处理DNS记录状态变更
    if (active !== undefined) {
      if (active === 0) {
        // 关闭记录 - 从Cloudflare删除
        await deleteDNSRecord(zone_id, cf_key, cf_email, record_id);
        message = "记录已关闭，DNS解析已停止";
      } else {
        // 开启记录 - 创建或更新DNS记录
        try {
          // 优先尝试更新
          response = await updateDNSRecord(zone_id, cf_key, cf_email, record_id, {
            name: userRecord.name,
            type: userRecord.type as any,
            content: userRecord.content || "",
            ttl: userRecord.ttl || 1,
            proxied: proxied !== undefined ? proxied : !!userRecord.proxied,
            comment: userRecord.comment || "",
          });
        } catch (error) {
          // 如果更新失败，则创建新记录
          response = await createDNSRecord(zone_id, cf_key, cf_email, {
            name: userRecord.name,
            type: userRecord.type as any,
            content: userRecord.content || "",
            ttl: userRecord.ttl || 1,
            proxied: proxied !== undefined ? proxied : !!userRecord.proxied,
            comment: userRecord.comment || "",
          });
        }

        if (response.result?.id) {
          // 更新数据库中的记录ID
          await prisma.userRecord.update({
            where: {
              id: userRecord.id,
            },
            data: {
              record_id: response.result.id,
              active: 1,
            },
          });
          message = "记录已开启，DNS解析已生效";
        }
      }
    } else if (proxied !== undefined) {
      // 仅更新代理状态
      response = await updateDNSRecord(zone_id, cf_key, cf_email, record_id, {
        name: userRecord.name,
        type: userRecord.type as any,
        content: userRecord.content || "",
        ttl: userRecord.ttl || 1,
        proxied: proxied,
        comment: userRecord.comment || "",
      });
      
      message = proxied ? "已启用Cloudflare代理" : "已禁用Cloudflare代理";
    }

    // 更新数据库中的记录状态和代理状态
    await prisma.userRecord.update({
      where: {
        id: userRecord.id,
      },
      data: {
        active: active !== undefined ? active : userRecord.active,
        proxied: proxied !== undefined ? proxied : userRecord.proxied,
      },
    });

    // 检查目标可访问性并添加到响应消息
    if (target && active === 1) {
      try {
        const checkResult = await fetch(`https://${target}`, {
          method: "HEAD",
          redirect: "manual",
          headers: {
            "User-Agent": "APIL-DNS-Check/1.0",
          },
        });
        
        if (!checkResult.ok && checkResult.status >= 400) {
          message += `，但目标地址 ${target} 当前不可访问`;
        }
      } catch (error) {
        message += `，但目标地址 ${target} 当前不可访问`;
      }
    }

    // 重新验证路径以刷新页面数据
    revalidatePath("/dashboard/records");
    
    return NextResponse.json({
      success: true,
      message,
      record_id: response?.result?.id,
    });
  } catch (error) {
    console.error("DNS记录更新错误:", error);
    return NextResponse.json(
      { error: "服务器处理失败", details: (error as Error).message },
      { status: 500 }
    );
  }
}
