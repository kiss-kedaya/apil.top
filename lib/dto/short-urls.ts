import { UrlMeta, UserRole } from "@prisma/client";

import { prisma } from "@/lib/db";

import { getStartDate } from "../utils";

// 访问统计批量处理队列
const clicksQueue = new Map<string, {
  urlId: string;
  ip: string;
  data: Omit<UrlMeta, "id" | "createdAt" | "updatedAt">;
  timestamp: number;
}>();

// 批量处理间隔 (毫秒)
const BATCH_INTERVAL = 10000; // 10秒

// 上次批量处理时间
let lastBatchProcess = Date.now();

export interface ShortUrlFormData {
  id?: string;
  userId: string;
  userName: string;
  target: string;
  url: string;
  prefix: string;
  visible: number;
  active: number;
  expiration: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserShortUrlInfo extends ShortUrlFormData {
  // meta: Omit<UrlMeta, "id">;
  meta?: UrlMeta;
}

export async function getUserShortUrls(
  userId: string,
  active: number = 1,
  page: number,
  size: number,
  role: UserRole = "USER",
  userName: string = "",
  url: string = "",
  target: string = "",
) {
  let option: any =
    role === "USER"
      ? {
          userId,
          // active,
        }
      : {};

  if (userName) {
    option.userName = {
      contains: userName,
    };
  }
  if (url) {
    option.url = {
      contains: url,
    };
  }
  if (target) {
    option.target = {
      contains: target,
    };
  }

  const [total, list] = await prisma.$transaction([
    prisma.userUrl.count({
      where: option,
    }),
    prisma.userUrl.findMany({
      where: option,
      skip: (page - 1) * size,
      take: size,
      orderBy: {
        updatedAt: "desc",
      },
    }),
  ]);
  return {
    total,
    list,
  };
}

export async function getUserShortUrlCount(
  userId: string,
  active: number = 1,
  role: UserRole = "USER",
) {
  try {
    // Start of last month from now
    // const end = new Date();
    // const start = new Date(
    //   end.getFullYear(),
    //   end.getMonth() - 1,
    //   end.getDate(),
    //   end.getHours(),
    //   end.getMinutes(),
    //   end.getSeconds(),
    // );

    // Start of current month
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const [total, month_total] = await prisma.$transaction([
      prisma.userUrl.count({
        where: role === "USER" ? { userId } : {},
      }),
      prisma.userUrl.count({
        where:
          role === "USER"
            ? { userId, createdAt: { gte: start, lte: end } }
            : { createdAt: { gte: start, lte: end } },
      }),
    ]);
    return { total, month_total };
  } catch (error) {
    return { total: -1, month_total: -1 };
  }
}

export async function createUserShortUrl(data: ShortUrlFormData) {
  try {
    const res = await prisma.userUrl.create({
      data: {
        userId: data.userId,
        userName: data.userName || "Anonymous",
        target: data.target,
        url: data.url,
        prefix: data.prefix,
        visible: data.visible,
        active: data.active,
        expiration: data.expiration,
        password: data.password,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    return { status: "success", data: res };
  } catch (error) {
    return { status: error };
  }
}

export async function updateUserShortUrl(data: ShortUrlFormData) {
  try {
    const res = await prisma.userUrl.update({
      where: {
        id: data.id,
        userId: data.userId,
      },
      data: {
        target: data.target,
        url: data.url,
        visible: data.visible,
        prefix: data.prefix,
        // active: data.active,
        expiration: data.expiration,
        password: data.password,
        updatedAt: new Date().toISOString(),
      },
    });
    return { status: "success", data: res };
  } catch (error) {
    return { status: error };
  }
}

export async function updateUserShortUrlActive(
  userId: string,
  id: string,
  active: number = 1,
  role: UserRole = "USER",
) {
  try {
    const option = role === "USER" ? { userId, id } : { id };
    const res = await prisma.userUrl.update({
      where: option,
      data: {
        active,
        updatedAt: new Date().toISOString(),
      },
    });
    return { status: "success", data: res };
  } catch (error) {
    return { status: error };
  }
}

export async function updateUserShortUrlVisibility(
  id: string,
  visible: number,
) {
  try {
    const res = await prisma.userUrl.update({
      where: {
        id,
      },
      data: {
        visible,
        updatedAt: new Date().toISOString(),
      },
    });
    return { status: "success", data: res };
  } catch (error) {
    return { status: error };
  }
}

export async function deleteUserShortUrl(userId: string, urlId: string) {
  return await prisma.userUrl.delete({
    where: {
      id: urlId,
      userId,
    },
  });
}

export async function getUserUrlMetaInfo(
  urlId: string,
  dateRange: string = "",
) {
  const startDate = getStartDate(dateRange);

  return await prisma.urlMeta.findMany({
    where: {
      urlId,
      ...(startDate && {
        createdAt: { gte: startDate },
      }),
    },
    orderBy: { updatedAt: "asc" },
  });
}

export async function getUrlBySuffix(suffix: string) {
  return await prisma.userUrl.findFirst({
    where: {
      url: suffix,
    },
    select: {
      id: true,
      target: true,
      active: true,
      prefix: true,
      expiration: true,
      password: true,
      updatedAt: true,
    },
  });
}

// 处理统计数据队列，批量更新数据库
async function processBatchClicks() {
  if (clicksQueue.size === 0) return;
  
  try {
    // 获取队列中所有点击数据
    const clicks = Array.from(clicksQueue.values());
    
    // 清空队列
    clicksQueue.clear();
    
    // 按URL ID分组
    const clicksByUrlId = clicks.reduce((groups, click) => {
      const key = `${click.urlId}:${click.ip}`;
      if (!groups[key]) {
        groups[key] = click;
      }
      return groups;
    }, {} as Record<string, any>);
    
    // 批量更新数据库
    const operations = Object.values(clicksByUrlId).map((click: any) => {
      return prisma.urlMeta.upsert({
        where: {
          urlId_ip: {
            urlId: click.urlId,
            ip: click.ip,
          }
        },
        update: {
          click: { increment: 1 },
          city: click.data.city || null,
          country: click.data.country || null,
          region: click.data.region || null,
          latitude: click.data.latitude || null,
          longitude: click.data.longitude || null,
          referer: click.data.referer || null,
          lang: click.data.lang || null,
          device: click.data.device || null,
          browser: click.data.browser || null,
          updatedAt: new Date(),
        },
        create: {
          ...click.data,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    });
    
    // 执行批量操作
    await prisma.$transaction(operations);
    
    console.log(`批量处理了 ${operations.length} 条访问记录`);
  } catch (error) {
    console.error("处理批量点击失败:", error);
  }
  
  // 更新最后处理时间
  lastBatchProcess = Date.now();
}

// 定时检查是否需要处理队列
setInterval(() => {
  const now = Date.now();
  // 如果距离上次处理超过间隔时间或队列中有超过50条记录，则处理队列
  if ((now - lastBatchProcess > BATCH_INTERVAL && clicksQueue.size > 0) || clicksQueue.size >= 50) {
    processBatchClicks();
  }
}, 5000); // 每5秒检查一次

// 创建短链接访问记录 - 优化版
export async function createUserShortUrlMeta(
  data: Omit<UrlMeta, "id" | "createdAt" | "updatedAt">,
) {
  try {
    // 生成唯一键
    const key = `${data.urlId}:${data.ip}:${Date.now()}`;
    
    // 添加到队列
    clicksQueue.set(key, {
      urlId: data.urlId,
      ip: data.ip,
      data,
      timestamp: Date.now(),
    });
    
    // 如果队列太大，立即处理
    if (clicksQueue.size >= 100) {
      processBatchClicks();
    }
    
    return true;
  } catch (error) {
    console.error("添加访问记录到队列失败:", error);
    return false;
  }
}

export async function getUrlMetaLiveLog(userId?: string) {
  const whereClause = userId ? { userUrl: { userId } } : {};

  const logs = await prisma.urlMeta.findMany({
    take: 10,
    where: whereClause,
    orderBy: { updatedAt: "desc" },
    select: {
      ip: true,
      click: true,
      updatedAt: true,
      createdAt: true,
      city: true,
      country: true,
      userUrl: {
        select: {
          url: true,
          target: true,
        },
      },
    },
  });

  const formattedLogs = logs.map((log) => ({
    ...log,
    slug: log.userUrl.url,
    target: log.userUrl.target,
  }));

  return formattedLogs;
}
