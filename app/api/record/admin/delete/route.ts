import { env } from "@/env.mjs";
import { deleteDNSRecord } from "@/lib/cloudflare";
import { deleteUserRecord } from "@/lib/dto/cloudflare-dns-record";
import { checkUserStatus } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;
    if (user.role !== "ADMIN") {
      return Response.json(
        { message: "Unauthorized" },
        {
          status: 401,
          statusText: "Unauthorized",
        },
      );
    }

    const { record_id, zone_id, userId, active } = await req.json();
    if (!record_id || !userId) {
      return Response.json(
        { message: "RecordId and userId are required" },
        {
          status: 400,
        },
      );
    }

    const { CLOUDFLARE_ZONE_ID, CLOUDFLARE_API_KEY, CLOUDFLARE_EMAIL } = env;
    if (!CLOUDFLARE_ZONE_ID || !CLOUDFLARE_API_KEY || !CLOUDFLARE_EMAIL) {
      return Response.json(
        { message: "API key、zone iD and email are required" },
        {
          status: 401,
        },
      );
    }

    // Delete cf dns record first.
    const res = await deleteDNSRecord(
      CLOUDFLARE_ZONE_ID,
      CLOUDFLARE_API_KEY,
      CLOUDFLARE_EMAIL,
      record_id,
    );
    if (res && res.result?.id) {
      // Then delete user record.
      await deleteUserRecord(userId, record_id, zone_id, active);
      return Response.json(
        { message: "success" },
        {
          status: 200,
        },
      );
    }
    return Response.json(
      { message: "Not Implemented" },
      {
        status: 501,
      },
    );
  } catch (error) {
    console.error(error);
    const errorMessage =
      typeof error === "string"
        ? { message: error }
        : error && typeof error === "object"
          ? { message: error.statusText || "服务器错误", ...error }
          : { message: "服务器错误" };

    return Response.json(errorMessage, {
      status:
        error && typeof error === "object" && "status" in error
          ? error.status
          : 500,
    });
  }
}
