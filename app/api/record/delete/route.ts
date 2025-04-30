import { env } from "@/env.mjs";
import { deleteDNSRecord } from "@/lib/cloudflare";
import { deleteUserRecord } from "@/lib/dto/cloudflare-dns-record";
import { checkUserStatus } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;

    const { record_id, zone_id, active } = await req.json();
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
      await deleteUserRecord(user.id, record_id, zone_id, active);
      return Response.json(
        { message: "success" },
        {
          status: 201,
        },
      );
    }
    return Response.json({
      status: 501,
      statusText: "Not Implemented",
    });
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
      statusText:
        error && typeof error === "object" && "statusText" in error
          ? error.statusText
          : "服务器错误",
    });
  }
}
