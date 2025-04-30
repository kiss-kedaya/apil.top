import { env } from "@/env.mjs";
import { deleteUserShortUrl } from "@/lib/dto/short-urls";
import { checkUserStatus } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;
    if (user.role !== "ADMIN") {
      return Response.json({ message: "未授权" }, {
        status: 401,
        statusText: "未授权",
      });
    }

    const { url_id, userId } = await req.json();
    if (!url_id || !userId) {
      return Response.json({ message: "链接ID为必填项" }, {
        status: 400,
        statusText: "链接ID为必填项",
      });
    }

    await deleteUserShortUrl(userId, url_id);
    return Response.json({ message: "成功" });
  } catch (error) {
    console.error(error);
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
