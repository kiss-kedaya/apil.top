import { env } from "@/env.mjs";
import { getUserRecords } from "@/lib/dto/cloudflare-dns-record";
import {
  updateUserShortUrl,
  updateUserShortUrlActive,
} from "@/lib/dto/short-urls";
import { checkUserStatus } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;

    const { id, active } = await req.json();

    if (!id) {
      return Response.json(
        {
          statusText: "ID为必填项",
          message: "ID为必填项"
        },
        { status: 400 },
      );
    }

    const res = await updateUserShortUrlActive(user.id, id, active, user.role);
    if (res.status !== "success") {
      return Response.json({ message: "更新失败" }, {
        status: 400,
      });
    }
    return Response.json(res.data);
  } catch (error) {
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
