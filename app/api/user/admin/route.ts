import { env } from "@/env.mjs";
import { checkUserStatus, getAllUsers } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;
    if (user.role !== "ADMIN") {
      return Response.json({ message: "未授权" }, {
        status: 401,
        statusText: "未授权",
      });
    }

    const url = new URL(req.url);
    const page = url.searchParams.get("page");
    const size = url.searchParams.get("size");
    const email = url.searchParams.get("email") || "";
    const userName = url.searchParams.get("userName") || "";
    const data = await getAllUsers(
      Number(page || "1"),
      Number(size || "10"),
      email,
      userName,
    );

    return Response.json(data);
  } catch (error) {
    return Response.json({ statusText: "服务器错误" }, { status: 500 });
  }
}
