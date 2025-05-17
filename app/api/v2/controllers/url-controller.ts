import { createUserShortUrl, getUserShortUrls, deleteUserShortUrl, updateUserShortUrl } from "@/lib/dto/short-urls";
import { TeamPlanQuota } from "@/config/team";
import { restrictByTimeRange } from "@/lib/team";
import { createSuccessResponse, createErrorResponse } from "@/app/lib/api-utils";

/**
 * 获取用户短链接列表
 */
export async function getUserUrls(userId: string, req: Request) {
  const url = new URL(req.url);
  const page = url.searchParams.get("page");
  const size = url.searchParams.get("size");
  const userName = url.searchParams.get("userName") || "";
  const slug = url.searchParams.get("slug") || "";
  const target = url.searchParams.get("target") || "";
  
  const data = await getUserShortUrls(
    userId,
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

/**
 * 创建短链接
 */
export async function createUrl(userId: string, userName: string, team: string, urlData: any) {
  // 检查用户限制
  const limit = await restrictByTimeRange({
    model: "userUrl",
    userId,
    limit: TeamPlanQuota[team].SL_NewLinks,
    rangeType: "month",
  });
  
  if (limit) {
    return createErrorResponse(limit.statusText, limit.status);
  }

  const res = await createUserShortUrl({
    userId,
    userName: userName || "Anonymous",
    ...urlData
  });
  
  if (res.status !== "success") {
    return createErrorResponse(res.status, 502);
  }
  
  return createSuccessResponse(res.data, "短链接创建成功");
}

/**
 * 删除短链接
 */
export async function deleteUrl(userId: string, urlId: string) {
  try {
    await deleteUserShortUrl(userId, urlId);
    return createSuccessResponse({ deleted: true }, "短链接删除成功");
  } catch (error) {
    return createErrorResponse("短链接删除失败", 500);
  }
}

/**
 * 更新短链接
 */
export async function updateUrl(userId: string, urlId: string, updateData: any) {
  try {
    const result = await updateUserShortUrl({
      id: urlId,
      userId,
      ...updateData
    });
    
    if (!result || result.status !== 'success') {
      return createErrorResponse("短链接不存在或您无权更新", 404);
    }
    
    return createSuccessResponse(result.data, "短链接更新成功");
  } catch (error) {
    return createErrorResponse("短链接更新失败", 500);
  }
} 