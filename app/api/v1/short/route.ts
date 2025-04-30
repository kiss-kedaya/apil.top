import { TeamPlanQuota } from "@/config/team";
import { checkApiKey } from "@/lib/dto/api-key";
import { createUserShortUrl } from "@/lib/dto/short-urls";
import { restrictByTimeRange } from "@/lib/team";
import { createUrlSchema } from "@/lib/validations/url";

export async function POST(req: Request) {
  try {
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

    // check limit
    const limit = await restrictByTimeRange({
      model: "userUrl",
      userId: user.id,
      limit: TeamPlanQuota[user.team!].SL_NewLinks,
      rangeType: "month",
    });
    if (limit) return Response.json({ message: limit.statusText }, { status: limit.status });

    const data = await req.json();

    const { target, url, prefix, visible, active, expiration, password } =
      createUrlSchema.parse(data);
    if (!target || !url) {
      return Response.json({ message: "目标链接和短链标识为必填项" }, {
        status: 400,
      });
    }

    const res = await createUserShortUrl({
      userId: user.id,
      userName: user.name || "Anonymous",
      target,
      url,
      prefix,
      visible,
      active,
      expiration,
      password,
    });
    if (res.status !== "success") {
      return Response.json({ message: res.status }, {
        status: 502,
      });
    }
    return Response.json(res.data);
  } catch (error) {
    return Response.json({ message: error?.statusText || error }, {
      status: error.status || 500,
    });
  }
}
