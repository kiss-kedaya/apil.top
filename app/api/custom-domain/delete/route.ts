import { deleteUserCustomDomain } from "@/lib/dto/custom-domain";
import { checkUserStatus } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";

// 删除自定义域名
export async function POST(req: Request) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;

    const { id } = await req.json();
    if (!id) {
      return Response.json(
        { status: "error", message: "缺少域名ID" },
        { status: 400 }
      );
    }

    const result = await deleteUserCustomDomain(user.id, id);
    if (result.status === "error") {
      return Response.json(result, { status: 400 });
    }

    return Response.json(result);
  } catch (error) {
    console.error("删除自定义域名错误:", error);
    return Response.json(
      { status: "error", message: "删除自定义域名失败" },
      { status: 500 }
    );
  }
} 