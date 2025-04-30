import { env } from "@/env.mjs";
import { deleteUserShortUrl } from "@/lib/dto/short-urls";
import { checkUserStatus } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;
    if (user.role !== "ADMIN") {
      return Response.json("未授权", {
        status: 401,
        statusText: "未授权",
      });
    }

    const { url_id, userId } = await req.json();
    if (!url_id || !userId) {
      return Response.json("链接ID为必填项", {
        status: 400,
        statusText: "链接ID为必填项",
      });
    }

    await deleteUserShortUrl(userId, url_id);
    return Response.json("成功");
  } catch (error) {
    return Response.json(error?.statusText || error, {
      status: error.status || 500,
      statusText: error.statusText || "服务器错误",
    });
  }
}
