import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";
import * as vm from "vm";
import { z } from "zod";

// 验证请求的Schema
const executeJsSchema = z.object({
  jsPath: z.string().min(1, "JavaScript文件路径不能为空"),
  params: z.record(z.any()).optional().default({}),
  timeout: z.number().optional().default(5000), // 默认5秒超时
  functionName: z.string().optional(), // 要调用的函数名
  functionParams: z.array(z.any()).optional(), // 函数参数数组
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 验证输入数据
    const validationResult = executeJsSchema.safeParse(body);
    if (!validationResult.success) {
      console.error(
        "无效的JavaScript执行请求:",
        validationResult.error.message,
      );
      return Response.json(
        { error: "无效的请求参数", details: validationResult.error.message },
        { status: 400 },
      );
    }

    const data = validationResult.data;
    const jsPath = data.jsPath;
    const params = data.params;
    const timeout = data.timeout;
    const functionName = data.functionName;
    const functionParams = data.functionParams || [];

    // 安全检查：确保文件路径在允许的目录内
    const allowedDir = path.resolve(process.cwd(), "scripts");
    const fullPath = path.resolve(process.cwd(), jsPath);

    if (!fullPath.startsWith(allowedDir)) {
      return Response.json(
        {
          error: "安全限制",
          details: "只能执行scripts目录下的JavaScript文件",
        },
        { status: 403 },
      );
    }

    // 检查文件是否存在
    if (!fs.existsSync(fullPath)) {
      return Response.json(
        {
          error: "文件不存在",
          details: `找不到指定的JavaScript文件: ${jsPath}`,
        },
        { status: 404 },
      );
    }

    // 读取JavaScript文件内容
    const jsContent = fs.readFileSync(fullPath, "utf-8");

    // 准备沙箱环境
    const consoleLogs: string[] = [];
    const context = vm.createContext({
      params: params,
      console: {
        logs: consoleLogs,
        log: function (...args: any[]) {
          consoleLogs.push(args.map((arg) => String(arg)).join(" "));
        },
        error: function (...args: any[]) {
          consoleLogs.push("[ERROR] " + args.map((arg) => String(arg)).join(" "));
        },
        warn: function (...args: any[]) {
          consoleLogs.push("[WARN] " + args.map((arg) => String(arg)).join(" "));
        },
        info: function (...args: any[]) {
          consoleLogs.push("[INFO] " + args.map((arg) => String(arg)).join(" "));
        },
      },
      result: null,
    });

    // 执行JavaScript代码
    try {
      // 首先加载JS文件内容
      const scriptContent = `
        try {
          ${jsContent}
          
          // 设置一个全局变量，用于存储执行结果
          var __executionResult = null;
          
          // 如果指定了函数名，则调用该函数
          ${functionName ? `
            // 检查函数是否存在
            if (typeof ${functionName} !== 'function') {
              throw new Error('指定的函数 ${functionName} 不存在或不是一个函数');
            }
            
            // 调用函数并保存结果
            __executionResult = ${functionName}(...${JSON.stringify(functionParams)});
          ` : `
            // 没有指定函数名，执行普通脚本逻辑
            __executionResult = result;
          `}
        } catch(e) {
          console.error('脚本执行错误:', e.message);
          throw e;
        }
      `;
      
      // 设置超时
      const script = new vm.Script(scriptContent);
      
      // 执行脚本
      const vmOptions = { timeout: timeout };
      script.runInContext(context, vmOptions);

      // 获取执行结果
      const executionResult = vm.runInContext('__executionResult', context);
      
      return Response.json({
        success: true,
        result: executionResult,
        logs: consoleLogs,
      });
    } catch (execError) {
      return Response.json(
        {
          error: "脚本执行失败",
          details: execError.message,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("执行JavaScript API错误:", error);
    return Response.json(
      {
        error: "服务器错误",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
