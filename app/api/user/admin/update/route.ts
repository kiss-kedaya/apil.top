import { checkUserStatus, updateUser } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;
    if (user.role !== "ADMIN") {
      return Response.json("未授权", {
        status: 401,
      });
    }

    const { id, data } = await req.json();

    const res = await updateUser(id, {
      name: data.name,
      email: data.email,
      role: data.role,
      active: data.active,
      team: data.team,
      image: data.image,
      apiKey: data.apiKey,
    });
    if (!res?.id) {
      return Response.json("发生错误", {
        status: 400,
      });
    }
    return Response.json("成功");
  } catch (error) {
    return Response.json({ statusText: "服务器错误" }, { status: 500 });
  }
}
