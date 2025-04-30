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
    return Response.json(error?.statusText || error, {
      status: error.status || 500,
      statusText: error.statusText || "服务器错误",
    });
  }
}
