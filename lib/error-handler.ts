import { logger } from "@/lib/logger";

/**
 * 错误类型枚举
 */
export enum ErrorType {
  VALIDATION = "VALIDATION_ERROR",
  DATABASE = "DATABASE_ERROR",
  AUTHENTICATION = "AUTHENTICATION_ERROR",
  AUTHORIZATION = "AUTHORIZATION_ERROR",
  NOT_FOUND = "NOT_FOUND_ERROR",
  RATE_LIMIT = "RATE_LIMIT_ERROR",
  INTERNAL = "INTERNAL_ERROR",
  EXTERNAL_SERVICE = "EXTERNAL_SERVICE_ERROR",
}

/**
 * 应用错误类
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly context: Record<string, any>;
  public readonly originalError?: Error;

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL,
    statusCode: number = 500,
    context: Record<string, any> = {},
    originalError?: Error
  ) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.statusCode = statusCode;
    this.context = context;
    this.originalError = originalError;

    // 保留原始堆栈信息
    if (originalError && originalError.stack) {
      this.stack = originalError.stack;
    }
  }

  /**
   * 将错误转换为可安全返回给客户端的格式
   */
  public toSafeResponse(includeDetails: boolean = false): Record<string, any> {
    const response: Record<string, any> = {
      message: this.message,
      type: this.type,
      statusCode: this.statusCode,
    };

    // 在开发环境或明确要求时包含更多详细信息
    if (includeDetails) {
      response.context = this.context;
      if (this.originalError) {
        response.originalError = {
          message: this.originalError.message,
          name: this.originalError.name,
        };
      }
    }

    return response;
  }
}

/**
 * 错误处理服务
 */
export class ErrorHandler {
  /**
   * 处理API路由中的错误
   * @param error 捕获到的错误
   * @param includeDetails 是否在响应中包含详细信息
   * @returns 格式化的响应对象
   */
  static handleApiError(error: any, includeDetails: boolean = false): Response {
    // 将非AppError转换为AppError
    const appError = ErrorHandler.normalizeError(error);
    
    // 记录错误
    ErrorHandler.logError(appError);
    
    // 返回格式化的响应
    return Response.json(
      appError.toSafeResponse(includeDetails),
      { status: appError.statusCode }
    );
  }

  /**
   * 将各种错误转换为统一的AppError格式
   * @param error 原始错误
   * @returns AppError实例
   */
  static normalizeError(error: any): AppError {
    // 已经是AppError
    if (error instanceof AppError) {
      return error;
    }
    
    // Prisma错误
    if (error.code && error.meta) {
      return new AppError(
        "数据库操作失败",
        ErrorType.DATABASE,
        500,
        {
          code: error.code,
          target: error.meta.target,
        },
        error
      );
    }
    
    // Zod验证错误
    if (error.errors && Array.isArray(error.errors)) {
      return new AppError(
        "输入数据验证失败",
        ErrorType.VALIDATION,
        400,
        { validationErrors: error.errors },
        error
      );
    }
    
    // 其他未知错误
    return new AppError(
      error.message || "发生未知错误",
      ErrorType.INTERNAL,
      500,
      {},
      error
    );
  }

  /**
   * 记录错误信息
   * @param error AppError实例
   */
  static logError(error: AppError): void {
    const logData = {
      type: error.type,
      message: error.message,
      context: error.context,
    };
    
    if (error.originalError) {
      logData.originalError = {
        message: error.originalError.message,
        name: error.originalError.name,
        stack: error.originalError.stack,
      };
    }
    
    switch (error.type) {
      case ErrorType.VALIDATION:
        logger.warn("验证错误", logData);
        break;
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
        logger.warn("权限错误", logData);
        break;
      case ErrorType.RATE_LIMIT:
        logger.warn("速率限制错误", logData);
        break;
      case ErrorType.NOT_FOUND:
        logger.info("资源未找到", logData);
        break;
      default:
        logger.error("应用错误", logData);
    }
  }

  /**
   * 创建验证错误
   */
  static validationError(message: string, context: Record<string, any> = {}): AppError {
    return new AppError(message, ErrorType.VALIDATION, 400, context);
  }

  /**
   * 创建认证错误
   */
  static authenticationError(message: string = "认证失败", context: Record<string, any> = {}): AppError {
    return new AppError(message, ErrorType.AUTHENTICATION, 401, context);
  }

  /**
   * 创建授权错误
   */
  static authorizationError(message: string = "权限不足", context: Record<string, any> = {}): AppError {
    return new AppError(message, ErrorType.AUTHORIZATION, 403, context);
  }

  /**
   * 创建资源未找到错误
   */
  static notFoundError(message: string = "资源未找到", context: Record<string, any> = {}): AppError {
    return new AppError(message, ErrorType.NOT_FOUND, 404, context);
  }

  /**
   * 创建速率限制错误
   */
  static rateLimitError(message: string = "请求频率过高", context: Record<string, any> = {}): AppError {
    return new AppError(message, ErrorType.RATE_LIMIT, 429, context);
  }

  /**
   * 创建内部错误
   */
  static internalError(message: string = "内部服务器错误", context: Record<string, any> = {}): AppError {
    return new AppError(message, ErrorType.INTERNAL, 500, context);
  }

  /**
   * 创建外部服务错误
   */
  static externalServiceError(message: string, service: string, context: Record<string, any> = {}): AppError {
    return new AppError(
      message,
      ErrorType.EXTERNAL_SERVICE,
      500,
      { ...context, service }
    );
  }
} 