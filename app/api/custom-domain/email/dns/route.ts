import { NextResponse } from "next/server";
import { auth } from "@/auth";

import { verifyEmailDNSRecords } from "@/lib/dto/custom-domain";

// 验证邮箱DNS记录
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const result = await verifyEmailDNSRecords(userId, data.id);

    if (result.status === "error") {
      return NextResponse.json(
        { error: result.message, details: result.details },
        { status: 400 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("验证邮箱DNS记录API错误:", error);
    return NextResponse.json({ error: "处理请求时发生错误" }, { status: 500 });
  }
}
