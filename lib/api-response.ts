import { NextResponse } from "next/server";

export type ApiStatus = "success" | "error";

export interface ApiSuccessResponse<T = any> {
  status: "success";
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  status: "error";
  message: string;
  details?: any;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * 创建成功响应
 * @param data 返回的数据
 * @param message 可选的成功消息
 * @returns NextResponse对象
 */
export function successResponse<T = any>(
  data: T,
  message?: string
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({
    status: "success",
    data,
    ...(message && { message }),
  });
}

/**
 * 创建错误响应
 * @param message 错误消息
 * @param status HTTP状态码
 * @param details 可选的错误详情
 * @returns NextResponse对象
 */
export function errorResponse(
  message: string,
  status: number = 400,
  details?: any
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      status: "error",
      message,
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * 处理API请求中的异常，生成标准化错误响应
 * @param error 捕获的错误
 * @param defaultMessage 默认错误消息
 * @returns NextResponse对象
 */
export function handleApiError(
  error: unknown,
  defaultMessage: string = "内部服务器错误"
): NextResponse<ApiErrorResponse> {
  console.error("API错误:", error);
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (error instanceof Error && error.stack) {
    console.error("错误堆栈:", error.stack);
  }
  
  return errorResponse(defaultMessage, 500, errorMessage);
} 