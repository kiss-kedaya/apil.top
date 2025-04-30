import { getUserUrlMetaInfo } from "@/lib/dto/short-urls";
import { checkUserStatus } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;

    const url = new URL(req.url);
    const urlId = url.searchParams.get("id");
    const range = url.searchParams.get("range") || "24h";

    if (!urlId) {
      return Response.json({ message: "链接ID为必填项" }, {
        status: 400,
      });
    }

    const data = await getUserUrlMetaInfo(urlId, range);

    return Response.json(data);
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
