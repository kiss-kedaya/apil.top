import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";
import { VM } from "vm2";
import { z } from "zod";

// 验证请求的Schema
const executeJsSchema = z.object({
  jsPath: z.string().min(1, "JavaScript文件路径不能为空"),
  params: z.record(z.any()).optional().default({}),
  timeout: z.number().optional().default(5000), // 默认5秒超时
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

    // 使用vm2进行安全的JavaScript执行
    const vm = new VM({
      timeout: timeout,
      sandbox: {
        params: params,
        console: {
          logs: [],
          log: function (...args) {
            this.logs.push(args.map((arg) => String(arg)).join(" "));
          },
          error: function (...args) {
            this.logs.push(
              "[ERROR] " + args.map((arg) => String(arg)).join(" "),
            );
          },
          warn: function (...args) {
            this.logs.push(
              "[WARN] " + args.map((arg) => String(arg)).join(" "),
            );
          },
          info: function (...args) {
            this.logs.push(
              "[INFO] " + args.map((arg) => String(arg)).join(" "),
            );
          },
        },
        result: null,
      },
    });

    // 执行JavaScript代码
    try {
      vm.run(`
        try {
          ${jsContent}
        } catch(e) {
          console.error('脚本执行错误:', e.message);
        }
      `);

      // 获取执行结果
      const result = vm.run('result');
      const logs = vm.run('console.logs');
      
      return Response.json({
        success: true,
        result: result,
        logs: logs,
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
