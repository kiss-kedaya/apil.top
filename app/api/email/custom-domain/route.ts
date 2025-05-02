import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { errorResponse, successResponse } from "@/lib/api-response";
import { env } from "@/env.mjs";

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
  // 添加webhook认证密钥
  webhookKey: z.string().optional(),
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
    
    // 验证webhook密钥（如果配置了）
    const webhookKey = env.EMAIL_WEBHOOK_KEY;
    if (webhookKey && body.webhookKey !== webhookKey) {
      logger.error("邮件webhook密钥验证失败");
      return errorResponse("未授权的请求", 401);
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
        enableEmail: true
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
      // 如果用户邮箱不存在，自动创建
      try {
        const localPart = to.split('@')[0];
        
        // 过滤非法字符和长度检查
        if (localPart.length < 3 || /[^a-zA-Z0-9._-]/.test(localPart)) {
          logger.warn(`邮箱地址格式不合规范: ${to}`);
          return errorResponse("邮箱地址格式不合规范", 400);
        }
        
        // 创建新的用户邮箱
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
        
        // 使用新创建的邮箱保存邮件
        const savedEmail = await saveForwardEmail(to, emailData);
        
        // 如果有配置转发，执行转发
        if (customDomain.user?.email) {
          await forwardToUserEmail(emailData, customDomain.user.email);
        }
        
        return successResponse({
          success: true,
          emailId: savedEmail.id,
          message: "邮件接收成功，已自动创建邮箱"
        });
      } catch (error) {
        logger.error(`处理新邮箱失败: ${to}`, { error });
        return errorResponse("处理邮件失败", 500);
      }
    } else {
      // 使用现有邮箱保存邮件
      try {
        const savedEmail = await saveForwardEmail(to, emailData);
        
        // 如果有配置转发，执行转发
        if (customDomain.user?.email) {
          await forwardToUserEmail(emailData, customDomain.user.email);
        }
        
        return successResponse({
          success: true,
          emailId: savedEmail.id,
          message: "邮件接收成功"
        });
      } catch (error) {
        logger.error(`保存邮件失败: ${to}`, { error });
        return errorResponse("保存邮件失败", 500);
      }
    }
  } catch (error) {
    logger.error("处理自定义域名邮件失败", { error });
    return errorResponse("处理邮件失败", 500);
  }
}

/**
 * 保存转发的邮件
 * @param to 收件人邮箱
 * @param emailData 邮件数据
 */
async function saveForwardEmail(to: string, emailData: any) {
  try {
    const forwardEmail = await prisma.forwardEmail.create({
      data: {
        from: emailData.from,
        fromName: emailData.fromName || "",
        to: to,
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
    
    logger.info(`邮件保存成功: ${emailData.from} -> ${to}`, {
      emailId: forwardEmail.id,
      subject: emailData.subject
    });
    
    return forwardEmail;
  } catch (error) {
    logger.error("保存邮件失败", { error });
    throw error;
  }
}

/**
 * 转发邮件到用户主邮箱
 * @param emailData 邮件数据
 * @param userEmail 用户主邮箱
 */
async function forwardToUserEmail(emailData: any, userEmail: string): Promise<void> {
  // 这里使用您的邮件发送服务（如使用nodemailer等）
  // 实际代码取决于您使用的邮件发送服务
  
  try {
    // 示例：记录转发请求
    logger.info(`邮件转发请求: 转发到 ${userEmail}`, {
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject
    });
    
    // TODO: 实现实际的邮件转发逻辑
    // 例如:
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({
    //   from: `"转发服务" <forward@example.com>`,
    //   to: userEmail,
    //   subject: `[转发] ${emailData.subject || 'No Subject'}`,
    //   text: emailData.text || '',
    //   html: emailData.html || '',
    //   attachments: JSON.parse(emailData.attachments || '[]')
    // });
    
  } catch (error) {
    logger.error(`邮件转发失败: 转发到 ${userEmail}`, { error });
    // 不抛出异常，避免影响主流程
  }
} 