import { getUserShortUrls } from "@/lib/dto/short-urls";
import { checkUserStatus } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;
    if (user.role !== "ADMIN") {
      return Response.json("未授权", {
        status: 401,
        statusText: "未授权",
      });
    }

    const url = new URL(req.url);
    const page = url.searchParams.get("page");
    const size = url.searchParams.get("size");
    const userName = url.searchParams.get("userName") || "";
    const slug = url.searchParams.get("slug") || "";
    const target = url.searchParams.get("target") || "";
    const data = await getUserShortUrls(
      user.id,
      1,
      Number(page || "1"),
      Number(size || "10"),
      "ADMIN",
      userName,
      slug,
      target,
    );

    return Response.json(data);
  } catch (error) {
    console.log(error);

    return Response.json(error?.statusText || error, {
      status: error.status || 500,
      statusText: error.statusText || "服务器错误",
    });
  }
}
