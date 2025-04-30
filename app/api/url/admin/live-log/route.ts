import { getUrlMetaLiveLog } from "@/lib/dto/short-urls";
import { checkUserStatus } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const user = checkUserStatus(await getCurrentUser());

    const url = new URL(req.url);
    const isAdmin = url.searchParams.get("admin");

    if (isAdmin === "true") {
      if (user instanceof Response) return user;
      if (user.role !== "ADMIN") {
        return Response.json({ message: "未授权" }, {
          status: 401,
          statusText: "未授权",
        });
      }
    }

    const logs = await getUrlMetaLiveLog(
      isAdmin === "true" ? undefined : user.id,
    );

    return Response.json(logs);
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
