import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { siteConfig } from "@/config/site";
import { TeamPlanQuota } from "@/config/team";
import { getVerifiedUserCustomDomains } from "@/lib/dto/custom-domain";
import {
  createUserEmail,
  deleteUserEmail,
  getAllUserEmails,
} from "@/lib/dto/email";
import { checkUserStatus } from "@/lib/dto/user";
import { reservedAddressSuffix } from "@/lib/enums";
import { getCurrentUser } from "@/lib/session";
import { restrictByTimeRange } from "@/lib/team";
import { logger } from "@/lib/logger";

const createEmailSchema = z.object({
  emailAddress: z.string().min(5),
});

// 自定义域名接口定义
interface CustomDomain {
  id: string;
  userId: string;
  domainName: string;
  isVerified: boolean;
  // 其他可能的属性
}

// 查询所有 UserEmail 地址
export async function GET(req: NextRequest) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const size = parseInt(url.searchParams.get("size") || "10");
    const search = url.searchParams.get("search") || "";
    const all = url.searchParams.get("all") === "true";
    const unread = url.searchParams.get("unread") === "true";

    // 获取用户的所有邮箱和已验证的自定义域名
    const [emailResult, domainsResult] = await Promise.all([
      getAllUserEmails(user.id, page, size, search, all, unread),
      getVerifiedUserCustomDomains(user.id),
    ]);

    // 为结果添加可用域名列表
    const availableDomains = [...siteConfig.emailDomains];

    // 如果有已验证的自定义域名，将其添加到可用域名列表
    if (
      domainsResult.status === "success" &&
      Array.isArray(domainsResult.data) &&
      domainsResult.data.length > 0
    ) {
      const domains = domainsResult.data as CustomDomain[];
      const customDomains = domains.map((domain) => domain.domainName);
      availableDomains.push(...customDomains);
    }

    return NextResponse.json(
      {
        ...emailResult,
        availableDomains,
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error("获取用户邮箱列表失败:", error);
    return NextResponse.json(
      { status: "error", message: "获取用户邮箱列表失败" },
      { status: 500 },
    );
  }
}

// 创建新 UserEmail
export async function POST(req: NextRequest) {
  const user = checkUserStatus(await getCurrentUser());
  if (user instanceof Response) return user;

  // check limit
  const limit = await restrictByTimeRange({
    model: "userEmail",
    userId: user.id,
    limit: TeamPlanQuota[user.team].EM_EmailAddresses,
    rangeType: "month",
  });
  if (limit)
    return NextResponse.json(
      { message: limit.statusText },
      { status: limit.status },
    );

  const { emailAddress } = createEmailSchema.parse(await req.json());

  if (!emailAddress) {
    return NextResponse.json(
      { message: "缺少用户ID或邮箱地址" },
      { status: 400 },
    );
  }

  const prefix = emailAddress.split("@")[0];
  if (!prefix || prefix.length < 5) {
    return NextResponse.json(
      { message: "邮箱地址前缀长度必须至少为5个字符" },
      {
        status: 400,
      },
    );
  }

  if (reservedAddressSuffix.includes(prefix)) {
    return NextResponse.json({ message: "无效的邮箱地址" }, { status: 400 });
  }

  // 检查域名是否是系统默认域名或用户验证的自定义域名
  const domain = emailAddress.split("@")[1];
  let isValidDomain = siteConfig.emailDomains.includes(domain);

  if (!isValidDomain) {
    // 检查是否是用户验证的自定义域名
    const domainsResult = await getVerifiedUserCustomDomains(user.id);
    if (
      domainsResult.status === "success" &&
      Array.isArray(domainsResult.data)
    ) {
      const domains = domainsResult.data as CustomDomain[];
      isValidDomain = domains.some((d) => d.domainName === domain);
    }
  }

  if (!isValidDomain) {
    return NextResponse.json(
      {
        status: "error",
        message: "域名不合法，请使用系统提供的域名或您已验证的自定义域名",
      },
      { status: 400 },
    );
  }

  try {
    const userEmail = await createUserEmail(user.id, emailAddress);
    return NextResponse.json(userEmail, { status: 201 });
  } catch (error) {
    // console.log("创建用户邮箱时出错:", error);
    if (error.message === "Invalid userId") {
      return NextResponse.json({ error: "无效的用户ID" }, { status: 400 });
    }
    if (error.code === "P2002") {
      return NextResponse.json(
        { message: "邮箱地址已存在" },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json({ message: "服务器内部错误" }, { status: 500 });
  }
}
