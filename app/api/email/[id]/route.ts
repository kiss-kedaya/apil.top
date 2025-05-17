import { NextRequest, NextResponse } from "next/server";

import {
  deleteUserEmail,
  getUserEmailById,
  updateUserEmail,
} from "@/lib/dto/email";
import { checkUserStatus } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";
import { logger } from "@/lib/logger";

// 查询单个 UserEmail
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = checkUserStatus(await getCurrentUser());
  if (user instanceof Response) return user;

  const { id } = params;

  try {
    const userEmail = await getUserEmailById(id);
    if (!userEmail) {
      return NextResponse.json(
        { error: "用户邮箱未找到或已删除" },
        { status: 404 },
      );
    }
    return NextResponse.json(userEmail, { status: 200 });
  } catch (error) {
    logger.error("获取用户邮箱时出错:", error);
    if (error.message === "Email not found") {
      return NextResponse.json({ message: "邮箱未找到" }, { status: 404 });
    }
    return NextResponse.json({ message: "服务器内部错误" }, { status: 500 });
  }
}

// 更新 UserEmail 的 emailAddress
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = checkUserStatus(await getCurrentUser());
  if (user instanceof Response) return user;

  const { id } = params;
  const { emailAddress } = await req.json();

  if (!emailAddress || !id) {
    return NextResponse.json({ message: "缺少邮箱地址" }, { status: 400 });
  }

  try {
    const userEmail = await updateUserEmail(id, emailAddress);
    return NextResponse.json(userEmail, { status: 200 });
  } catch (error) {
    logger.error("更新用户邮箱时出错:", error);
    if (error.message === "User email not found or already deleted") {
      return NextResponse.json("用户邮箱未找到或已删除", { status: 404 });
    }
    if (error.code === "P2002") {
      return NextResponse.json({ message: "邮箱地址已存在" }, { status: 409 });
    }
    if (error.message === "Email address not found") {
      return NextResponse.json({ message: "邮箱地址未找到" }, { status: 404 });
    }
    return NextResponse.json({ message: "服务器内部错误" }, { status: 500 });
  }
}

// 删除 UserEmail
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = checkUserStatus(await getCurrentUser());
  if (user instanceof Response) return user;

  const { id } = params;

  try {
    await deleteUserEmail(id);
    return NextResponse.json({ message: "成功" }, { status: 200 });
  } catch (error) {
    logger.error("删除用户邮箱时出错:", error);
    if (error.message === "User email not found or already deleted") {
      return NextResponse.json("用户邮箱未找到或已删除", { status: 404 });
    }
    if (error.message === "Email not found") {
      return NextResponse.json({ message: "邮箱未找到" }, { status: 404 });
    }
    return NextResponse.json({ message: "服务器内部错误" }, { status: 500 });
  }
}
