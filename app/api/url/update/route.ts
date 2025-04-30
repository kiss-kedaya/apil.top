import { env } from "@/env.mjs";
import { getUserRecords } from "@/lib/dto/cloudflare-dns-record";
import { updateUserShortUrl } from "@/lib/dto/short-urls";
import { checkUserStatus } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";
import { createUrlSchema } from "@/lib/validations/url";

export async function POST(req: Request) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;

    const { data } = await req.json();
    if (!data?.id) {
      return Response.json({ message: `链接ID为必填项` }, {
        status: 400,
      });
    }

    const { target, url, prefix, visible, active, id, expiration, password } =
      createUrlSchema.parse(data);
    const res = await updateUserShortUrl({
      id,
      userId: user.id,
      userName: user.name || "Anonymous",
      target,
      prefix,
      url,
      visible,
      active,
      expiration,
      password,
    });
    if (res.status !== "success") {
      return Response.json({ message: res.status }, {
        status: 400,
      });
    }
    return Response.json(res.data);
  } catch (error) {
    return Response.json(error?.statusText || error, {
      status: error.status || 500,
    });
  }
}
