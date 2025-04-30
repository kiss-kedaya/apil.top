"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// 新增自定义域名验证
export const createCustomDomainSchema = z.object({
  domainName: z.string().min(1).max(100),
  isCloudflare: z.boolean().default(true),
  zoneId: z.string().optional(),
  apiKey: z.string().optional(),
  email: z.string().optional(),
});

// 更新自定义域名验证
export const updateCustomDomainSchema = z.object({
  id: z.string().min(1),
  domainName: z.string().min(1).max(100),
  isCloudflare: z.boolean().default(true),
  zoneId: z.string().optional(),
  apiKey: z.string().optional(),
  email: z.string().optional(),
  isVerified: z.boolean().optional(),
});

// 创建自定义域名
export async function createUserCustomDomain(userId: string, data: any) {
  try {
    const { domainName, isCloudflare, zoneId, apiKey, email } = 
      createCustomDomainSchema.parse(data);

    // 生成随机验证密钥
    const verificationKey = Array(16)
      .fill(0)
      .map(() => Math.random().toString(36).charAt(2))
      .join("");

    const res = await prisma.userCustomDomain.create({
      data: {
        userId,
        domainName,
        isCloudflare,
        zoneId,
        apiKey,
        email,
        verificationKey,
        isVerified: false,
      },
    });

    return { status: "success", data: res };
  } catch (error) {
    console.error("创建自定义域名错误:", error);
    return { status: "error", message: error };
  }
}

// 获取用户所有自定义域名
export async function getUserCustomDomains(userId: string) {
  try {
    const domains = await prisma.userCustomDomain.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { status: "success", data: domains };
  } catch (error) {
    console.error("获取自定义域名列表错误:", error);
    return { status: "error", message: error };
  }
}

// 获取单个自定义域名
export async function getUserCustomDomainById(userId: string, id: string) {
  try {
    const domain = await prisma.userCustomDomain.findFirst({
      where: {
        id,
        userId,
      },
    });

    return { status: "success", data: domain };
  } catch (error) {
    console.error("获取自定义域名详情错误:", error);
    return { status: "error", message: error };
  }
}

// 删除自定义域名
export async function deleteUserCustomDomain(userId: string, id: string) {
  try {
    await prisma.userCustomDomain.delete({
      where: {
        id,
        userId,
      },
    });

    return { status: "success" };
  } catch (error) {
    console.error("删除自定义域名错误:", error);
    return { status: "error", message: error };
  }
}

// 更新自定义域名
export async function updateUserCustomDomain(userId: string, data: any) {
  try {
    const { id, domainName, isCloudflare, zoneId, apiKey, email, isVerified } = 
      updateCustomDomainSchema.parse(data);

    const res = await prisma.userCustomDomain.update({
      where: {
        id,
        userId,
      },
      data: {
        domainName,
        isCloudflare,
        zoneId,
        apiKey,
        email,
        isVerified,
        updatedAt: new Date(),
      },
    });

    return { status: "success", data: res };
  } catch (error) {
    console.error("更新自定义域名错误:", error);
    return { status: "error", message: error };
  }
}

// 验证自定义域名
export async function verifyUserCustomDomain(userId: string, id: string) {
  try {
    const domain = await prisma.userCustomDomain.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!domain) {
      return { status: "error", message: "域名不存在" };
    }

    // 这里应该实现实际的域名验证逻辑
    // 比如检查DNS记录是否已正确配置

    // 假设验证通过
    const res = await prisma.userCustomDomain.update({
      where: {
        id,
        userId,
      },
      data: {
        isVerified: true,
        updatedAt: new Date(),
      },
    });

    return { status: "success", data: res };
  } catch (error) {
    console.error("验证自定义域名错误:", error);
    return { status: "error", message: error };
  }
} 