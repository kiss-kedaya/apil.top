export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { logger } from "@/lib/logger";

import { getEmailServiceStatus } from "@/lib/dto/custom-domain";

// 获取邮箱服务状态
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const userId = session.user.id;

    // 从URL参数中获取域名ID
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const result = await getEmailServiceStatus(userId, id);

    if (result.status === "error") {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    await  logger.error("获取邮箱服务状态API错误:", error);
    return NextResponse.json({ error: "处理请求时发生错误" }, { status: 500 });
  }
}
