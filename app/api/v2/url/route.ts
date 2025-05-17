import { createUrlSchema } from "@/lib/validations/url";
import { withApiHandler } from "@/app/lib/api-utils";
import { withValidation, withSession } from "@/app/lib/api-middleware";
import { createUrl, getUserUrls } from "@/app/api/v2/controllers/url-controller";

// 获取URL列表
export const GET = withApiHandler(
  async (req: Request) => {
    return withSession(req, async (req, user) => {
      return getUserUrls(user.id, req);
    });
  },
  "v2/url"
);

// 创建新URL
export const POST = withApiHandler(
  (req: Request) => {
    return withValidation(createUrlSchema, async (req, data) => {
      return withSession(req, async (req, user) => {
        return createUrl(user.id, user.name, user.team, data);
      });
    })(req);
  },
  "v2/url"
); 