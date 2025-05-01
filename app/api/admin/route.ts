import { checkUserStatus } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";

export const revalidate = 60;

export async function GET(req: Request) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;
    
    // 简化后的API，仅返回日志相关权限
    return Response.json({ 
      status: "success",
      message: "所有用户可访问日志",
      data: {
        canViewLogs: true
      }
    });
  } catch (error) {
    return Response.json({ message: "服务器错误" }, { status: 500 });
  }
}
