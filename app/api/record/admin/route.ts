import { env } from "@/env.mjs";
import { getUserRecords } from "@/lib/dto/cloudflare-dns-record";
import { checkUserStatus } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;
    if (user.role !== "ADMIN") {
      return Response.json({ message: "Unauthorized" }, {
        status: 401,
        statusText: "Unauthorized",
      });
    }

    const url = new URL(req.url);
    const page = url.searchParams.get("page");
    const size = url.searchParams.get("size");

    const data = await getUserRecords(
      user.id,
      1,
      Number(page || "1"),
      Number(size || "10"),
      "ADMIN",
    );

    return Response.json(data);
  } catch (error) {
    const errorMessage = typeof error === 'string' 
      ? { message: error } 
      : (error && typeof error === 'object' 
          ? { message: error.statusText || '服务器错误', ...error } 
          : { message: '服务器错误' });
    
    return Response.json(errorMessage, {
      status: error && typeof error === 'object' && 'status' in error ? error.status : 500
    });
  }
}
