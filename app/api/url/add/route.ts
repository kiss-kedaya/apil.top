import { TeamPlanQuota } from "@/config/team";
import { createUserShortUrl } from "@/lib/dto/short-urls";
import { restrictByTimeRange } from "@/lib/team";
import { createUrlSchema } from "@/lib/validations/url";
import { withApiHandler, createSuccessResponse, createErrorResponse } from "@/app/lib/api-utils";
import { withValidation, withSession } from "@/app/lib/api-middleware";

async function handleCreateUrl(req: Request, user: any, validatedData: any) {
  // 检查用户限制
  const limit = await restrictByTimeRange({
    model: "userUrl",
    userId: user.id,
    limit: TeamPlanQuota[user.team].SL_NewLinks,
    rangeType: "month",
  });
  
  if (limit) {
    return createErrorResponse(limit.statusText, limit.status);
  }

  const { target, url, prefix, visible, active, expiration, password } = validatedData;
  
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
    return createErrorResponse(res.status, 502);
  }
  
  return createSuccessResponse(res.data, "短链接创建成功");
}

async function processUrlCreation(req: Request, validatedData: any) {
  return withSession(req, async (req, user) => {
    return handleCreateUrl(req, user, validatedData);
  });
}

export const POST = withApiHandler(
  (req: Request) => withValidation(createUrlSchema, processUrlCreation)(req),
  "url/add"
);
