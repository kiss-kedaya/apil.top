import { deleteUserById } from "@/lib/dto/user";
import { withAuth } from "@/app/lib/api-middleware";
import { createSuccessResponse, createErrorResponse } from "@/app/lib/api-utils";

export const DELETE = withAuth(async (req, user) => {
  try {
    await deleteUserById(user.id);
    return createSuccessResponse({ success: true }, "用户删除成功！");
  } catch (error) {
    return createErrorResponse("用户删除失败", 500);
  }
});
