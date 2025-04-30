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
        return new Response(JSON.stringify({ message: "未授权" }), {
          status: 401,
          statusText: "Unauthorized",
          headers: {
            "Content-Type": "application/json; charset=utf-8"
          }
        });
      }
    }

    const logs = await getUrlMetaLiveLog(
      isAdmin === "true" ? undefined : user.id,
    );

    return new Response(JSON.stringify(logs), {
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      }
    });
  } catch (error) {
    const errorMessage = typeof error === 'string' 
      ? { message: error } 
      : (error && typeof error === 'object' 
          ? { message: error.statusText || '服务器错误', ...error } 
          : { message: '服务器错误' });
    
    return new Response(JSON.stringify(errorMessage), {
      status: error && typeof error === 'object' && 'status' in error ? error.status : 500,
      statusText: "Internal Server Error",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      }
    });
  }
}
