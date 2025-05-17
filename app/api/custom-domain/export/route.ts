import { NextRequest } from "next/server";
import { auth } from "auth";
import { logger } from "@/lib/logger";

import { errorResponse, handleApiError } from "@/lib/api-response";
import { getUserCustomDomains } from "@/lib/dto/custom-domain";

// 辅助函数：将异步迭代器转换为流
function iteratorToStream(iterator: AsyncIterator<any>) {
  return new ReadableStream({
    async pull(controller) {
      try {
        const { value, done } = await iterator.next();
        if (done) {
          controller.close();
        } else {
          controller.enqueue(value);
        }
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

// 用于缓冲延迟
function sleep(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

// 创建用于导出域名数据的迭代器
async function* createDomainExportIterator(userId: string) {
  const encoder = new TextEncoder();

  try {
    // 开始JSON数组
    yield encoder.encode('{\n  "status": "success",\n  "data": [\n');

    // 获取域名数据
    const result = await getUserCustomDomains(userId);

    if (result.status === "error") {
      yield encoder.encode(`    {"error": "${result.message}"}\n`);
    } else if (Array.isArray(result.data)) {
      // 遍历并流式输出每个域名
      for (let i = 0; i < result.data.length; i++) {
        const domain = result.data[i];
        const isLast = i === result.data.length - 1;

        // 将域名数据格式化为JSON并添加到流中
        const domainJson = JSON.stringify(domain, null, 4);
        yield encoder.encode(`    ${domainJson}${isLast ? "" : ","}\n`);

        // 人为添加一些延迟，模拟大型数据集
        await sleep(100);
      }
    }

    // 结束JSON数组
    yield encoder.encode("  ]\n}");
  } catch (error) {
    logger.error("流式输出域名时出错:", error);
    yield encoder.encode(`    {"error": "流式输出域名时出错"}\n  ]\n}`);
  }
}

// 流式导出域名数据
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse("未授权访问", 401);
    }

    const userId = session.user.id;

    // 创建流
    const iterator = createDomainExportIterator(userId);
    const stream = iteratorToStream(iterator);

    // 返回流式响应
    return new Response(stream, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Content-Disposition": "attachment; filename=custom-domains.json",
      },
    });
  } catch (error) {
    return handleApiError(error, "导出域名数据失败");
  }
}
