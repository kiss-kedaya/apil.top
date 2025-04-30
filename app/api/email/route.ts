import { NextRequest, NextResponse } from "next/server";

import { TeamPlanQuota } from "@/config/team";
import { createUserEmail, getAllUserEmails } from "@/lib/dto/email";
import { checkUserStatus } from "@/lib/dto/user";
import { reservedAddressSuffix } from "@/lib/enums";
import { getCurrentUser } from "@/lib/session";
import { restrictByTimeRange } from "@/lib/team";

// 查询所有 UserEmail 地址
export async function GET(req: NextRequest) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const size = parseInt(searchParams.get("size") || "10", 10);
    const search = searchParams.get("search") || "";
    const all = searchParams.get("all") || "false";
    const unread = searchParams.get("unread") || "false";

    if (all === "true" && user.role === "ADMIN") {
    }

    const userEmails = await getAllUserEmails(
      user.id,
      page,
      size,
      search,
      user.role === "ADMIN" && all === "true",
      unread === "true",
    );
    return NextResponse.json(userEmails, { status: 200 });
  } catch (error) {
    console.error("Error fetching user emails:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
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
    return NextResponse.json({ message: limit.statusText }, { status: limit.status });

  const { emailAddress } = await req.json();

  if (!emailAddress) {
    return NextResponse.json({ message: "Missing userId or emailAddress" }, { status: 400 });
  }

  const prefix = emailAddress.split("@")[0];
  if (!prefix || prefix.length < 5) {
    return NextResponse.json({ message: "Email address length must be at least 5" }, {
      status: 400,
    });
  }

  if (reservedAddressSuffix.includes(prefix)) {
    return NextResponse.json({ message: "Invalid email address" }, { status: 400 });
  }

  try {
    const userEmail = await createUserEmail(user.id, emailAddress);
    return NextResponse.json(userEmail, { status: 201 });
  } catch (error) {
    // console.log("Error creating user email:", error);
    if (error.message === "Invalid userId") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error.code === "P2002") {
      return NextResponse.json({ message: "Email address already exists" }, {
        status: 409,
      });
    }

    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
