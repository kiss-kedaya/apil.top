import { auth } from "@/auth";
import { checkUserStatus } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";
import { createErrorResponse } from "./api-utils";
import { ZodSchema } from "zod";

/**
 * 需要用户认证的API中间件
 */
export function withAuth(handler: (req: Request, user: any) => Promise<Response>) {
  return auth(async (req) => {
    if (!req.auth) {
      return createErrorResponse("未认证", 401);
    }

    const currentUser = req.auth.user;
    if (!currentUser || !currentUser?.id) {
      return createErrorResponse("用户无效", 401);
    }

    const user = checkUserStatus(currentUser);
    if (user instanceof Response) return user;

    return handler(req, user);
  });
}

/**
 * 数据验证中间件
 */
export function withValidation<T>(schema: ZodSchema<T>, handler: (req: Request, data: T) => Promise<Response>) {
  return async (req: Request) => {
    try {
      const body = await req.json();
      const validatedData = schema.parse(body.data || body);
      return handler(req, validatedData);
    } catch (error) {
      return createErrorResponse(
        error instanceof Error ? error.message : "数据验证失败", 
        400
      );
    }
  };
}

/**
 * 获取当前会话用户中间件
 */
export async function withSession(req: Request, handler: (req: Request, user: any) => Promise<Response>) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;
    
    return handler(req, user);
  } catch (error) {
    return createErrorResponse("会话获取失败", 401);
  }
} 