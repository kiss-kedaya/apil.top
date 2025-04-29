import { TeamPlanQuota } from "@/config/team";
import { checkApiKey } from "@/lib/dto/api-key";
import { createUserShortUrl } from "@/lib/dto/short-urls";
import { restrictByTimeRange } from "@/lib/team";
import { createUrlSchema } from "@/lib/validations/url";

export async function POST(req: Request) {
  try {
    const custom_api_key = req.headers.get("wrdo-api-key");
    if (!custom_api_key) {
      return Response.json("Unauthorized", {
        status: 401,
      });
    }

    // Check if the API key is valid
    const user = await checkApiKey(custom_api_key);
    if (!user?.id) {
      return Response.json(
        "Invalid API key. You can get your API key from https://wr.do/dashboard/settings.",
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
    if (limit) return Response.json(limit.statusText, { status: limit.status });

    const data = await req.json();

    const { target, url, prefix, visible, active, expiration, password } =
      createUrlSchema.parse(data);
    if (!target || !url) {
      return Response.json("Target url and slug are required", {
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
      return Response.json(res.status, {
        status: 502,
      });
    }
    return Response.json(res.data);
  } catch (error) {
    return Response.json(error?.statusText || error, {
      status: error.status || 500,
    });
  }
}
