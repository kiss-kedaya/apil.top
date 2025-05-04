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
    // 验证用户身份
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;

    const { CLOUDFLARE_ZONE_ID, CLOUDFLARE_API_KEY, CLOUDFLARE_EMAIL } = env;
    if (!CLOUDFLARE_ZONE_ID || !CLOUDFLARE_API_KEY || !CLOUDFLARE_EMAIL) {
      return Response.json({ message: "API密钥和区域ID是必需的。" }, {
        status: 401,
      });
    }

    // 解析请求参数
    const body = await request.json();
    const validation = updateParamsSchema.safeParse(body);
    
    if (!validation.success) {
      return Response.json(
        { error: "参数验证失败", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { zone_id, record_id, active, proxied, target } = validation.data;

    // 从数据库获取记录信息
    const recordData = await prisma.userRecord.findUnique({
      where: {
        record_id,
        zone_id,
      }
    });
    
    if (!recordData) {
      return Response.json({ message: "找不到该DNS记录" }, { status: 404 });
    }
    
    let response;
    let message = "";

    // 处理记录状态变更
    if (active !== undefined) {
      if (active === 0) {
        // 关闭记录 - 从Cloudflare删除
        try {
          await deleteDNSRecord(
            CLOUDFLARE_ZONE_ID,
            CLOUDFLARE_API_KEY,
            CLOUDFLARE_EMAIL,
            record_id
          );
        } catch (error) {
          console.log("删除DNS记录失败，可能已不存在:", error);
        }
        
        // 更新数据库中的状态
        const res = await updateUserRecordState(
          user.id,
          record_id,
          zone_id,
          active
        );
        
        if (!res) {
          return Response.json({ message: "更新状态失败" }, { status: 502 });
        }
        
        message = "状态已关闭，DNS记录已从Cloudflare移除";
      } else {
        // 检查目标可访问性
        let isTargetAccessible = false;
        if (target) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const target_res = await fetch(`https://${target}`, {
              method: 'HEAD',
              headers: {
                'User-Agent': 'DNS-Check-Bot'
              },
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            isTargetAccessible = target_res.status === 200;
          } catch (error) {
            isTargetAccessible = false;
            console.log(`无法访问目标: ${error}`);
          }
        }
        
        // 重新创建DNS记录
        try {
          // 使用原始记录内容创建新记录
          const proxyStatus = proxied !== undefined ? proxied : (recordData.proxied === null ? false : recordData.proxied);
          
          console.log("创建DNS记录，代理状态:", proxyStatus);
          
          const recordToCreate = {
            type: recordData.type,
            name: recordData.name,
            content: recordData.content || "",
            ttl: recordData.ttl || 1,
            proxied: proxyStatus,
            comment: recordData.comment || "",
            tags: recordData.tags ? recordData.tags.split(",") : []
          };
          
          const createResult = await createDNSRecord(
            CLOUDFLARE_ZONE_ID,
            CLOUDFLARE_API_KEY,
            CLOUDFLARE_EMAIL,
            recordToCreate
          );
          
          if (!createResult.success) {
            return Response.json({ 
              message: "重新创建DNS记录失败", 
              errors: createResult.errors 
            }, { status: 500 });
          }
          
          // 获取新记录ID
          const newRecordId = createResult.result?.id;
          
          if (!newRecordId) {
            return Response.json({ message: "创建记录后未获得新ID" }, { status: 500 });
          }
          
          // 删除旧记录，避免数据库引用错误
          await prisma.userRecord.delete({
            where: {
              record_id,
              zone_id
            }
          });
          
          // 创建更新后的记录
          await prisma.userRecord.create({
            data: {
              userId: user.id,
              record_id: newRecordId,
              zone_id: CLOUDFLARE_ZONE_ID,
              zone_name: recordData.zone_name,
              name: recordData.name,
              type: recordData.type,
              content: recordData.content || "",
              ttl: recordData.ttl || 1,
              proxied: proxyStatus,
              proxiable: recordData.proxiable, 
              comment: recordData.comment || "",
              tags: recordData.tags || "",
              created_on: new Date().toISOString(),
              modified_on: new Date().toISOString(),
              active: 1
            }
          });
          
          message = isTargetAccessible ? 
            "状态已开启，DNS记录已重新创建，且目标可访问!" : 
            "状态已开启，DNS记录已重新创建，但目标不可访问!";
            
          return Response.json({
            message,
            record_id: newRecordId
          });
        } catch (error) {
          console.error("重新创建DNS记录时出错:", error);
          return Response.json({ 
            message: "重新创建DNS记录时出错", 
            error: String(error) 
          }, { status: 500 });
        }
      }
    } else if (proxied !== undefined) {
      // 仅更新代理状态
      try {
        response = await updateDNSRecord(
          CLOUDFLARE_ZONE_ID,
          CLOUDFLARE_API_KEY,
          CLOUDFLARE_EMAIL, 
          record_id, 
          {
            name: recordData.name,
            type: recordData.type,
            content: recordData.content || "",
            ttl: recordData.ttl || 1,
            proxied: proxied,
            comment: recordData.comment || ""
          }
        );
        
        // 更新数据库中的代理状态
        await prisma.userRecord.update({
          where: {
            record_id,
            zone_id
          },
          data: {
            proxied
          }
        });
        
        message = proxied ? "已启用Cloudflare代理" : "已禁用Cloudflare代理";
        
        return Response.json({
          message,
          success: true
        });
      } catch (error) {
        console.error("更新代理状态失败:", error);
        return Response.json({ 
          message: "更新代理状态失败", 
          error: String(error) 
        }, { status: 500 });
      }
    }
    
    return Response.json({
      success: true,
      message
    });
  } catch (error) {
    console.error("DNS记录更新错误:", error);
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
