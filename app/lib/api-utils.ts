import { logger } from "@/lib/logger";

/**
 * 标准API响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: number;
}

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(data: T, message?: string): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message
  };
  
  return Response.json(response);
}

/**
 * 创建错误响应
 */
export function createErrorResponse(message: string, status: number = 500, code?: number): Response {
  const response: ApiResponse = {
    success: false,
    message,
    code
  };
  
  return Response.json(response, { status });
}

/**
 * 统一错误处理
 */
export async function handleApiError(error: any, context: string): Promise<Response> {
  await logger.error(`[${context}] ${error}`);
  
  const errorMessage = typeof error === 'string' 
    ? error 
    : (error && typeof error === 'object' 
        ? (error.message || error.statusText || '服务器错误')
        : '服务器错误');
  
  const statusCode = error && typeof error === 'object' && 'status' in error 
    ? error.status 
    : 500;
  
  return createErrorResponse(errorMessage, statusCode);
}

/**
 * API路由包装器
 */
export function withApiHandler(handler: (req: Request) => Promise<Response>, context: string) {
  return async (req: Request): Promise<Response> => {
    try {
      return await handler(req);
    } catch (error) {
      return handleApiError(error, context);
    }
  };
} 