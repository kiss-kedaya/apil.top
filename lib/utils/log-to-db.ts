import { prisma } from "@/lib/db";

/**
 * 将日志写入数据库，替代console.log和console.error
 * @param level 日志级别: 'info' | 'error' | 'warn'
 * @param message 日志消息
 * @param details 可选的详细信息，会被JSON.stringify
 */
export async function logToDb(level: "info" | "error" | "warn", message: string, details?: any) {
  try {
    // 获取调用堆栈信息，帮助定位日志来源
    const stack = new Error().stack || '';
    const stackLines = stack.split('\n');
    const callerLine = stackLines.length > 2 ? stackLines[2] : '';
    const caller = callerLine.trim();

    // 使用原始SQL而不是Prisma ORM来写入日志，避免类型错误
    await prisma.$executeRaw`
      INSERT INTO dev_logs (id, level, message, details, caller, created_at)
      VALUES (gen_random_uuid(), ${level}, ${message}, ${details ? JSON.stringify(details) : null}, ${caller}, NOW())
    `;
  } catch (e) {
    // 避免循环报错，这里使用原生console
    console.error("写入日志到数据库失败:", e);
  }
}

/**
 * info级别日志，替代console.log
 */
export function logInfo(message: string, details?: any) {
  // 不使用await，避免阻塞主流程
  void logToDb("info", message, details);
}

/**
 * error级别日志，替代console.error
 */
export function logError(message: string, details?: any) {
  void logToDb("error", message, details);
}

/**
 * warn级别日志，替代console.warn
 */
export function logWarn(message: string, details?: any) {
  void logToDb("warn", message, details);
} 