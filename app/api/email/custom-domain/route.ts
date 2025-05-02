import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { errorResponse, successResponse } from "@/lib/api-response";

// 自定义域名邮件请求验证模式
const customDomainEmailSchema = z.object({
  from: z.string().email(),
  fromName: z.string().optional(),
  to: z.string().email(),
  subject: z.string().optional(),
  text: z.string().optional(),
  html: z.string().optional(),
  date: z.string().optional(),
  messageId: z.string().optional(),
  replyTo: z.string().optional(),
  cc: z.string().optional(),
  headers: z.string().optional(),
  attachments: z.string().optional(),
});

/**
 * 处理自定义域名的邮件接收
 */
export async function POST(request: NextRequest) {
  try {
    // 验证请求数据
    const body = await request.json();
    const validationResult = customDomainEmailSchema.safeParse(body);
    
    if (!validationResult.success) {
      logger.error("邮件请求数据验证失败", validationResult.error);
      return errorResponse(validationResult.error.message, 400);
    }
    
    const emailData = validationResult.data;
    const { to } = emailData;
    
    // 解析邮件地址中的域名部分
    const domainPart = to.split('@')[1];
    if (!domainPart) {
      logger.error(`无效的邮件地址: ${to}`);
      return errorResponse("无效的邮件地址", 400);
    }
    
    // 查找域名对应的用户
    const customDomain = await prisma.userCustomDomain.findFirst({
      where: {
        domainName: domainPart,
        isVerified: true,
        enableEmail: true,
        emailVerified: true
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
    
    if (!customDomain) {
      logger.warn(`未找到有效的自定义域名邮箱: ${domainPart}`);
      return errorResponse("未找到有效的邮箱域名", 404);
    }
    
    logger.info(`收到自定义域名邮件: ${to}`, {
      userId: customDomain.userId,
      domain: domainPart
    });
    
    // 检查收件人邮箱是否存在
    const userEmail = await prisma.userEmail.findUnique({
      where: {
        emailAddress: to
      }
    });
    
    if (!userEmail) {
      // 如果用户邮箱不存在，检查是否应该创建新邮箱或忽略
      const localPart = to.split('@')[0];
      
      // 检查是否应该自动创建邮箱（可根据实际需求修改逻辑）
      const shouldCreateEmail = localPart.length >= 5;
      
      if (shouldCreateEmail) {
        // 创建新的用户邮箱
        try {
          const newUserEmail = await prisma.userEmail.create({
            data: {
              userId: customDomain.userId,
              emailAddress: to
            }
          });
          
          logger.info(`自动创建新邮箱: ${to}`, {
            userId: customDomain.userId,
            emailId: newUserEmail.id
          });
          
          // 继续处理邮件，使用新创建的邮箱
          await saveForwardEmail(newUserEmail.id, emailData);
        } catch (error) {
          logger.error(`创建邮箱失败: ${to}`, { error });
          return errorResponse("创建邮箱失败", 500);
        }
      } else {
        logger.warn(`邮箱不存在且无法自动创建: ${to}`);
        return errorResponse("邮箱不存在", 404);
      }
    } else {
      // 使用现有邮箱处理邮件
      await saveForwardEmail(userEmail.id, emailData);
    }
    
    return successResponse({ success: true }, "邮件接收成功");
  } catch (error) {
    logger.error("处理自定义域名邮件失败", { error });
    return errorResponse("处理邮件失败", 500);
  }
}

/**
 * 保存转发的邮件
 * @param emailId 邮箱ID
 * @param emailData 邮件数据
 */
async function saveForwardEmail(emailId: string, emailData: any) {
  try {
    const forwardEmail = await prisma.forwardEmail.create({
      data: {
        from: emailData.from,
        fromName: emailData.fromName || "",
        to: emailData.to,
        subject: emailData.subject || "No Subject",
        text: emailData.text || "",
        html: emailData.html || "",
        date: emailData.date || new Date().toISOString(),
        messageId: emailData.messageId || "",
        replyTo: emailData.replyTo || "",
        cc: emailData.cc || "[]",
        headers: emailData.headers || "[]",
        attachments: emailData.attachments || "[]"
      }
    });
    
    logger.info(`邮件保存成功: ${emailData.from} -> ${emailData.to}`, {
      emailId: forwardEmail.id,
      subject: emailData.subject
    });
    
    return forwardEmail;
  } catch (error) {
    logger.error("保存邮件失败", { error });
    throw error;
  }
} 