import { getUserShortUrls } from "@/lib/dto/short-urls";
import { withApiHandler, createSuccessResponse } from "@/app/lib/api-utils";
import { withSession } from "@/app/lib/api-middleware";

async function getUrlList(req: Request, user: any) {
  const url = new URL(req.url);
  const page = url.searchParams.get("page");
  const size = url.searchParams.get("size");
  const userName = url.searchParams.get("userName") || "";
  const slug = url.searchParams.get("slug") || "";
  const target = url.searchParams.get("target") || "";
  
  const data = await getUserShortUrls(
    user.id,
    1,
    Number(page || "1"),
    Number(size || "10"),
    "USER",
    userName,
    slug,
    target,
  );

  return createSuccessResponse(data);
}

export const GET = withApiHandler(
  async (req: Request) => withSession(req, (req, user) => getUrlList(req, user)),
  "url/list"
);
