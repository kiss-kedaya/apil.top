import { auth } from "auth";
import { prisma } from "@/lib/db";

// 开发模式下绕过管理员检查的暗号，只在开发环境下有效
const DEV_ADMIN_TOKEN = "dev-admin-access";

/**
 * 检查当前用户是否有管理员权限
 * 在开发模式下，可以通过特殊令牌绕过检查
 */
export async function isUserAdmin(devOverrideToken?: string) {
  // 如果是开发环境且提供了正确的开发者令牌，允许访问
  if (process.env.NODE_ENV === "development" && 
      devOverrideToken === DEV_ADMIN_TOKEN) {
    return true;
  }

  // 正常的管理员身份验证
  const session = await auth();
  if (!session?.user?.id) return false;
  
  try {
    // 使用原始SQL查询获取用户角色
    const result: any[] = await prisma.$queryRaw`
      SELECT role FROM users WHERE id = ${session.user.id} LIMIT 1
    `;
    
    // 调试日志
    console.log("用户角色查询结果:", JSON.stringify(result));
    
    if (result && result.length > 0) {
      // 检查用户是否为管理员
      return result[0]?.role === "ADMIN";
    }
    return false;
  } catch (error) {
    console.error("管理员权限检查失败:", error);
    return false;
  }
} 