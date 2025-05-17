import { createUrlSchema } from "@/lib/validations/url";
import { deleteUrl, updateUrl } from "@/app/api/v2/controllers/url-controller";
import { withSession, withValidation } from "@/app/lib/api-middleware";
import { createErrorResponse, withApiHandler } from "@/app/lib/api-utils";

// 获取路由参数
function getUrlId(req: Request): string | null {
  const segments = new URL(req.url).pathname.split("/");
  return segments[segments.length - 1] || null;
}

// 更新URL
export const PUT = withApiHandler((req: Request) => {
  const urlId = getUrlId(req);
  if (!urlId) {
    return Promise.resolve(createErrorResponse("无效的URL ID", 400));
  }

  return withValidation(createUrlSchema, async (req, data) => {
    return withSession(req, async (req, user) => {
      return updateUrl(user.id, urlId, data);
    });
  })(req);
}, "v2/url/update");

// 删除URL
export const DELETE = withApiHandler(async (req: Request) => {
  const urlId = getUrlId(req);
  if (!urlId) {
    return createErrorResponse("无效的URL ID", 400);
  }

  return withSession(req, async (req, user) => {
    return deleteUrl(user.id, urlId);
  });
}, "v2/url/delete");
