import { NextRequest, NextResponse } from "next/server";

import { TeamPlanQuota } from "@/config/team";
import { getUserSendEmailCount, saveUserSendEmail } from "@/lib/dto/email";
import { checkUserStatus } from "@/lib/dto/user";
import { resend } from "@/lib/email";
import { getCurrentUser } from "@/lib/session";
import { restrictByTimeRange } from "@/lib/team";
import { isValidEmail } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;

    // check limit
    const limit = await restrictByTimeRange({
      model: "userSendEmail",
      userId: user.id,
      limit: TeamPlanQuota[user.team].EM_SendEmails,
      rangeType: "month",
    });
    if (limit)
      return NextResponse.json({ message: limit.statusText }, { status: limit.status });

    const { from, to, subject, html } = await req.json();

    if (!from || !to || !subject || !html) {
      return NextResponse.json({ message: "缺少必需的字段" }, { status: 400 });
    }

    if (!isValidEmail(from) || !isValidEmail(to)) {
      return NextResponse.json({ message: "无效的电子邮件地址" }, { status: 403 });
    }

    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.log("Resend 错误:", error);
      return NextResponse.json({ message: "发送邮件失败" }, { status: 500 });
    }

    await saveUserSendEmail(user.id, from, to, subject, html);

    return NextResponse.json({ message: "成功" }, { status: 200 });
  } catch (error) {
    console.log("发送邮件时出错:", error);
    return NextResponse.json({ message: "服务器内部错误" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;

    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") || "false";

    const count = await getUserSendEmailCount(
      user.id,
      all === "true",
    );
    return NextResponse.json(count);
  } catch (error) {
    return NextResponse.json({ message: "服务器内部错误" }, { status: 500 });
  }
}
