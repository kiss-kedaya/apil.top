import { prisma } from "./prisma";

/**
 * 日志服务 - 提供应用程序日志记录功能
 */
export const logger = {
  /**
   * 记录信息级别日志
   * @param message 日志消息
   * @param context 上下文数据
   */
  info: async (message: string, context?: any) => {
    await logToDatabase("info", message, context);
    console.log(`[INFO] ${message}`, context ?? "");
  },

  /**
   * 记录警告级别日志
   * @param message 日志消息
   * @param context 上下文数据
   */
  warn: async (message: string, context?: any) => {
    await logToDatabase("warn", message, context);
    console.warn(`[WARN] ${message}`, context ?? "");
  },

  /**
   * 记录错误级别日志
   * @param message 日志消息
   * @param context 上下文数据
   */
  error: async (message: string, context?: any) => {
    await logToDatabase("error", message, context);
    console.error(`[ERROR] ${message}`, context ?? "");
  },
};

/**
 * 将日志记录到数据库
 * @param level 日志级别
 * @param message 日志消息
 * @param context 上下文数据
 */
async function logToDatabase(
  level: "info" | "warn" | "error",
  message: string,
  context?: any,
) {
  try {
    // 提取错误调用栈信息
    const stack = new Error().stack;
    const caller = stack?.split("\n")[3]?.trim() || undefined;

    // 格式化上下文数据
    let details: string | undefined = undefined;
    if (context) {
      if (context instanceof Error) {
        details = JSON.stringify({
          name: context.name,
          message: context.message,
          stack: context.stack,
        });
      } else {
        try {
          details = JSON.stringify(context);
        } catch (error) {
          details = String(context);
        }
      }
    }

    // 记录到数据库
    await prisma.devLog.create({
      data: {
        level,
        message,
        details,
        caller,
      },
    });
  } catch (error) {
    // 数据库记录失败时不抛出异常，仅在控制台记录
    console.error("记录日志到数据库失败", error);
  }
}
