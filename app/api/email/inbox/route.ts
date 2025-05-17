import { NextRequest, NextResponse } from "next/server";

import { getEmailsByEmailAddress } from "@/lib/dto/email";
import { checkUserStatus } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";
import { logger } from "@/lib/logger";

// 通过 emailAddress 查询所有相关 ForwardEmail
export async function GET(req: NextRequest) {
  const user = checkUserStatus(await getCurrentUser());
  if (user instanceof Response) return user;

  const { searchParams } = new URL(req.url);
  const emailAddress = searchParams.get("emailAddress");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("size") || "10", 10);

  if (!emailAddress) {
    return NextResponse.json(
      { error: "缺少邮箱地址参数" },
      { status: 400 },
    );
  }

  try {
    const emails = await getEmailsByEmailAddress(emailAddress, page, pageSize);
    return NextResponse.json(emails, { status: 200 });
  } catch (error) {
    logger.error("获取邮件时出错:", error);
    if (error.message === "Email address not found or has been deleted") {
      return NextResponse.json({ error: "邮箱地址未找到或已被删除" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 },
    );
  }
}
