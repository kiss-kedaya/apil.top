import { NextRequest, NextResponse } from "next/server";

import { siteConfig } from "@/config/site";
import { TeamPlanQuota } from "@/config/team";
import { checkApiKey } from "@/lib/dto/api-key";
import { createUserEmail, deleteUserEmailByAddress } from "@/lib/dto/email";
import { reservedAddressSuffix } from "@/lib/enums";
import { restrictByTimeRange } from "@/lib/team";

// 创建新 UserEmail
export async function POST(req: NextRequest) {
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
      { message: "API 密钥无效。你可以在 https://kedaya.xyz/dashboard/settings 获取你的 API 密钥。" },
      { status: 401 },
    );
  }
  if (user.active === 0) {
    return Response.json({ message: "禁止访问" }, {
      status: 403,
      statusText: "禁止访问",
    });
  }

  // check limit
  const limit = await restrictByTimeRange({
    model: "userEmail",
    userId: user.id,
    limit: TeamPlanQuota[user.team!].EM_EmailAddresses,
    rangeType: "month",
  });
  if (limit)
    return NextResponse.json(limit.statusText, { status: limit.status });

  const { emailAddress } = await req.json();

  if (!emailAddress) {
    return NextResponse.json({ message: "缺少用户ID或邮箱地址" }, { status: 400 });
  }

  const [prefix, suffix] = emailAddress.split("@");
  if (!prefix || prefix.length < 5) {
    return NextResponse.json({ message: "邮箱前缀长度至少为5位" }, {
      status: 400,
    });
  }
  if (!siteConfig.emailDomains.includes(suffix)) {
    return NextResponse.json({ message: "邮箱后缀无效" }, { status: 400 });
  }

  if (reservedAddressSuffix.includes(prefix)) {
    return NextResponse.json({ message: "邮箱地址无效" }, { status: 400 });
  }

  try {
    const userEmail = await createUserEmail(user.id, emailAddress);
    return NextResponse.json(userEmail, { status: 201 });
  } catch (error) {
    // console.log("Error creating user email:", error);
    if (error.message === "Invalid userId") {
      return NextResponse.json({ error: "用户ID无效" }, { status: 400 });
    }
    if (error.code === "P2002") {
      return NextResponse.json({ message: "邮箱地址已存在" }, {
        status: 409,
      });
    }
    return NextResponse.json({ message: "服务器内部错误" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
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
      { message: "API 密钥无效。你可以在 https://kedaya.xyz/dashboard/settings 获取你的 API 密钥。" },
      { status: 401 },
    );
  }
  if (user.active === 0) {
    return Response.json({ message: "禁止访问" }, {
      status: 403,
      statusText: "禁止访问",
    });
  }

  const { emailAddress } = await req.json();
  if (!emailAddress) {
    return NextResponse.json({ message: "缺少邮箱地址参数" }, {
      status: 400,
    });
  }

  try {
    await deleteUserEmailByAddress(emailAddress);
    return NextResponse.json({ message: "success" }, { status: 201 });
  } catch (error) {
    console.error("Error deleting user email:", error);
    if (error.message === "User email not found or already deleted") {
      return NextResponse.json({ message: "未找到该邮箱或已被删除" }, { status: 404 });
    }
    return NextResponse.json({ message: "服务器内部错误" }, { status: 500 });
  }
}
