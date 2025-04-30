import { updateUserCustomDomain, verifyUserCustomDomain } from "@/lib/dto/custom-domain";
import { checkUserStatus } from "@/lib/dto/user"; 
import { getCurrentUser } from "@/lib/session";

// 更新自定义域名
export async function POST(req: Request) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;

    const data = await req.json();
    const result = await updateUserCustomDomain(user.id, data);

    if (result.status === "error") {
      return Response.json(result, { status: 400 });
    }

    return Response.json(result);
  } catch (error) {
    console.error("更新自定义域名错误:", error);
    return Response.json(
      { status: "error", message: "更新自定义域名失败" },
      { status: 500 }
    );
  }
}

// 验证域名所有权
export async function PUT(req: Request) {
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

    const result = await verifyUserCustomDomain(user.id, id);
    if (result.status === "error") {
      return Response.json(result, { status: 400 });
    }

    return Response.json(result);
  } catch (error) {
    console.error("验证自定义域名错误:", error);
    return Response.json(
      { status: "error", message: "验证自定义域名失败" },
      { status: 500 }
    );
  }
} 