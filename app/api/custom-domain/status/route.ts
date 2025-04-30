import { getUserCustomDomainById } from "@/lib/dto/custom-domain";
import { checkUserStatus } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";

// 获取域名状态和验证详情
export async function GET(req: Request) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return Response.json(
        { status: "error", message: "缺少域名ID" },
        { status: 400 },
      );
    }

    // 获取域名详情
    const result = await getUserCustomDomainById(user.id, id);

    if (result.status === "error") {
      return Response.json(result, { status: 400 });
    }

    if (!result.data) {
      return Response.json(
        { status: "error", message: "域名不存在" },
        { status: 404 },
      );
    }

    // 构建域名状态信息
    const domain = result.data;
    const statusInfo = {
      id: domain.id,
      domainName: domain.domainName,
      isVerified: domain.isVerified,
      verificationKey: domain.verificationKey,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      verificationInstructions: {
        type: "TXT",
        name: `_kedaya.${domain.domainName}`,
        value: domain.verificationKey,
        instructions:
          "请在您的DNS控制面板中添加以上TXT记录，然后点击验证按钮。",
      },
    };

    return Response.json({ status: "success", data: statusInfo });
  } catch (error) {
    console.error("获取域名状态错误:", error);
    return Response.json(
      { status: "error", message: "获取域名状态失败" },
      { status: 500 },
    );
  }
}
