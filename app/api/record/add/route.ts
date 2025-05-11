import { env } from "@/env.mjs";
import { TeamPlanQuota } from "@/config/team";
import { createDNSRecord } from "@/lib/cloudflare";
import {
  createUserRecord,
  getUserRecordByTypeNameContent,
  getUserRecordCount,
} from "@/lib/dto/cloudflare-dns-record";
import { checkUserStatus } from "@/lib/dto/user";
import { reservedDomains } from "@/lib/enums";
import { getCurrentUser } from "@/lib/session";
import { generateSecret } from "@/lib/utils";

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
      return Response.json({ message: "API key、zone iD and email are required" }, {
        status: 401,
      });
    }

    // Check quota: 若是管理员则不检查，否则检查
    const { total } = await getUserRecordCount(user.id);
    if (
      user.role !== "ADMIN" &&
      total >= TeamPlanQuota[user.team].RC_NewRecords
    ) {
      return Response.json({ message: "Your records have reached the free limit." }, {
        status: 403,
      });
    }

    const { records } = await req.json();
    const record = {
      ...records[0],
      id: generateSecret(16),
      // 设置默认值，确保proxied默认为true
      proxied: records[0].proxied !== undefined ? records[0].proxied : true,
    };

    const record_name = record.name.endsWith(".qali.cn")
      ? record.name
      : record.name + ".qali.cn";

    if (reservedDomains.includes(record_name)) {
      return Response.json({ message: "Domain name is reserved" }, {
        status: 403,
      });
    }

    const user_record = await getUserRecordByTypeNameContent(
      user.id,
      record.type,
      record_name,
      record.content,
      1,
    );
    if (user_record && user_record.length > 0) {
      return Response.json({ message: "Record already exists" }, {
        status: 400,
      });
    }

    const data = await createDNSRecord(
      CLOUDFLARE_ZONE_ID,
      CLOUDFLARE_API_KEY,
      CLOUDFLARE_EMAIL,
      record,
    );

    if (!data.success || !data.result?.id) {
      console.log("[data]", data);
      return Response.json(data.messages, {
        status: 501,
      });
    } else {
      const res = await createUserRecord(user.id, {
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
        created_on: data.result.created_on,
        modified_on: data.result.modified_on,
        // 确保记录默认是开启状态
        active: 1,
      });

      if (res.status !== "success") {
        return Response.json(res.status, {
          status: 502,
        });
      }
      return Response.json(res.data);
    }
  } catch (error) {
    console.error("[错误]", error);
    const errorMessage = typeof error === 'string' 
      ? { message: error } 
      : (error && typeof error === 'object' 
          ? { message: error.statusText || JSON.stringify(error), ...error } 
          : { message: '服务器错误' });
    
    return Response.json(errorMessage, {
      status: error && typeof error === 'object' && 'status' in error ? error.status : 500
    });
  }
}
