import { NextRequest, NextResponse } from "next/server";

import { checkApiKey } from "@/lib/dto/api-key";
import { getEmailsByEmailAddress } from "@/lib/dto/email";
import { logger } from "@/lib/logger";

// 通过 emailAddress 查询所有相关 ForwardEmail
export async function GET(req: NextRequest) {
  const custom_api_key = req.headers.get("wrdo-api-key");
  if (!custom_api_key) {
    return Response.json({ message: "未授权" }, {
      status: 401,
    });
  }

  // Check if the API key is valid
  const user = await checkApiKey(custom_api_key);
  if (!user?.id) {
    return Response.json(
      { message: "API 密钥无效。你可以在 https://qali.cn/dashboard/settings 获取你的 API 密钥。" },
      { status: 401 },
    );
  }
  if (user.active === 0) {
    return Response.json({ message: "禁止访问" }, {
      status: 403,
      statusText: "禁止访问",
    });
  }

  const { searchParams } = new URL(req.url);
  const emailAddress = searchParams.get("emailAddress");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("size") || "10", 10);

  if (!emailAddress) {
    return NextResponse.json(
      { message: "缺少邮箱地址参数" },
      { status: 400 },
    );
  }

  try {
    const emails = await getEmailsByEmailAddress(emailAddress, page, pageSize);
    return NextResponse.json(emails, { status: 200 });
  } catch (error) {
    await  logger.error("Error fetching emails:", error);
    if (error.message === "Email address not found") {
      return NextResponse.json({ message: "未找到该邮箱地址" }, { status: 404 });
    }
    return NextResponse.json(
      { message: "服务器内部错误" },
      { status: 500 },
    );
  }
}
