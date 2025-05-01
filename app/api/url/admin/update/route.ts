import { env } from "@/env.mjs";
import { getUserRecords } from "@/lib/dto/cloudflare-dns-record";
import { updateUserShortUrl } from "@/lib/dto/short-urls";
import { checkUserStatus } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";
import { createUrlSchema } from "@/lib/validations/url";

export async function POST(req: Request) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;
    // 所有用户都可以访问，不再检查管理员权限

    const { data, userId } = await req.json();
    if (!data?.id || !userId) {
      return Response.json({ message: `链接ID为必填项` }, {
        status: 400,
        statusText: `链接ID为必填项`,
      });
    }

    const { target, url, prefix, visible, active, id, expiration, password } =
      createUrlSchema.parse(data);
    const res = await updateUserShortUrl({
      id,
      userId,
      userName: "",
      target,
      url,
      prefix,
      visible,
      active,
      expiration,
      password,
    });
    if (res.status !== "success") {
      return Response.json({ message: res.status }, {
        status: 400,
        statusText: `发生错误。${res.status}`,
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
      status: error && typeof error === 'object' && 'status' in error ? error.status : 500,
      statusText: error && typeof error === 'object' && 'statusText' in error ? error.statusText : '服务器错误',
    });
  }
}
