import { NextResponse } from "next/server";
import { auth } from "@/auth";

import {
  configureEmailService,
  getEmailServiceStatus,
  verifyEmailConfiguration,
  verifyEmailDNSRecords,
} from "@/lib/dto/custom-domain";
import { logger } from "@/lib/logger";

// 配置邮箱服务
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await request.json();

    const result = await configureEmailService(userId, data);

    if (result.status === "error") {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error("配置邮箱服务API错误:", error);
    return NextResponse.json({ error: "处理请求时发生错误" }, { status: 500 });
  }
}

// 验证邮箱配置
export async function PUT(request: Request) {
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

    const result = await verifyEmailConfiguration(userId, data.id);

    if (result.status === "error") {
      return NextResponse.json(
        { error: result.message, details: result.details },
        { status: 400 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error("验证邮箱配置API错误:", error);
    return NextResponse.json({ error: "处理请求时发生错误" }, { status: 500 });
  }
}
