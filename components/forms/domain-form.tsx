"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { InfoIcon } from "lucide-react";

import { UserCustomDomainData } from "@/app/(protected)/dashboard/custom-domains/domain-list";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Icons } from "@/components/shared/icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  domainName: z.string().min(3, {
    message: "域名必须至少为3个字符。",
  }),
});

interface DomainFormProps {
  user: {
    id: string;
    name: string;
  };
  isShowForm: boolean;
  setShowForm: (show: boolean) => void;
  initData: UserCustomDomainData | null;
  action: string;
  onSuccess?: () => void;
}

export function DomainForm({
  user,
  isShowForm,
  setShowForm,
  initData,
  action,
  onSuccess,
}: DomainFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDomain, setNewDomain] = useState<UserCustomDomainData | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);

  // 表单默认值
  const defaultValues = initData
    ? {
        domainName: initData.domainName,
      }
    : {
        domainName: "",
      };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // 检查域名验证状态
  useEffect(() => {
    if (newDomain && newDomain.id) {
      const checkVerificationStatus = async () => {
        console.log('🔵 开始检查域名验证状态:', newDomain);
        try {
          const response = await fetch(`/api/custom-domain/check-verification`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: newDomain.id }),
          });
          
          const data = await response.json();
          console.log('🔵 域名验证状态响应:', data);
          
          if (data.status === "success") {
            setVerificationStatus(data.data);
            console.log('✅ 设置验证状态:', data.data);
          }
        } catch (error) {
          console.error("❌ 检查验证状态出错:", error);
        }
      };
      
      checkVerificationStatus();
    }
  }, [newDomain]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    console.log('🔵 开始提交域名表单:', values);

    try {
      const url = initData
        ? `/api/custom-domain/update`
        : `/api/custom-domain`;
      
      const requestData = initData 
        ? { ...values, id: initData.id } 
        : { domainName: values.domainName };
        
      console.log(`🔵 发送${initData ? '更新' : '添加'}域名请求:`, {
        url,
        method: 'POST',
        data: requestData
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      // 记录原始响应状态
      console.log('🔵 收到响应状态:', {
        status: response.status,
        statusText: response.statusText
      });

      const data = await response.json();
      console.log('🔵 域名操作响应数据:', JSON.stringify(data, null, 2));

      if (data.status === "success") {
        console.log('✅ 域名操作成功:', initData ? '更新成功' : '添加成功');
        toast.success(
          initData
            ? "域名更新成功"
            : "域名添加成功，请按照指引完成域名验证"
        );
        if (data.data && !initData) {
          console.log('🔵 设置新域名数据:', data.data);
          console.log('🔵 Vercel绑定信息:', data.vercel);
          
          // 保存新添加的域名信息和Vercel绑定信息
          setNewDomain({
            ...data.data,
            vercel: data.vercel, // 保存Vercel返回的信息
          });
        } else {
          if (onSuccess) onSuccess();
          setShowForm(false);
          form.reset();
        }
      } else {
        console.error('❌ 域名操作失败:', data);
        toast.error(data.message || "操作失败");
        if (data.details) {
          console.error('❌ 错误详情:', data.details);
          toast.error(`详细原因: ${data.details}`);
        }
      }
    } catch (error) {
      console.error('❌ 提交表单出错:', error);
      if (error instanceof Error) {
        console.error('❌ 错误堆栈:', error.stack);
      }
      toast.error("提交表单出错");
      if (error instanceof Error) {
        toast.error(`错误详情: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
      console.log('🔵 表单提交流程结束');
    }
  }

  // 如果是编辑模式或者已经成功添加了新域名，显示验证指南
  if (newDomain) {
    return (
      <div className="mb-4">
        <Card>
          <CardHeader>
            <CardTitle>域名验证指南</CardTitle>
            <CardDescription>
              请按照以下步骤完成域名 {newDomain.domainName} 的验证
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="default" className="mb-4 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
              <InfoIcon className="h-5 w-5" />
              <AlertTitle>验证说明</AlertTitle>
              <AlertDescription>
                您需要在DNS服务商（如阿里云、腾讯云、Cloudflare等）添加一条TXT记录来验证域名所有权。
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="rounded-md border p-4 dark:border-slate-700">
                <h3 className="mb-2 font-semibold">验证步骤</h3>
                <ol className="ml-5 list-decimal space-y-2">
                  <li className="text-sm">
                    登录到您的DNS管理面板（如Cloudflare、阿里云、GoDaddy等）
                  </li>
                  <li className="text-sm">
                    添加一条<strong>TXT记录</strong>，具体设置如下：
                    <div className="my-2 rounded-md bg-slate-100 p-3 dark:bg-slate-800">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="font-medium">记录类型:</div>
                        <div>TXT</div>
                        <div className="font-medium">主机记录:</div>
                        <div className="break-all font-mono text-green-600">_kedaya</div>
                        <div className="font-medium">记录值:</div>
                        <div className="break-all font-mono text-green-600">
                          {newDomain.verificationKey}
                        </div>
                        <div className="font-medium">TTL:</div>
                        <div>600（10分钟）或默认</div>
                      </div>
                    </div>
                  </li>
                  <li className="text-sm">
                    等待DNS记录生效（通常几分钟，最长可能需要48小时）
                  </li>
                  <li className="text-sm">
                    生效后点击下方"验证"按钮完成验证
                  </li>
                </ol>
              </div>

              <div className="rounded-md border p-4 dark:border-slate-700">
                <h3 className="mb-2 font-semibold">验证注意事项</h3>
                <ul className="ml-5 list-disc space-y-1 text-sm">
                  <li>
                    只添加<strong>_kedaya</strong>作为主机记录，不要包含您的域名
                  </li>
                  <li>
                    某些DNS提供商可能需要您输入<strong>_kedaya.{newDomain.domainName}</strong>作为完整主机记录
                  </li>
                  <li>
                    确保验证密钥完全匹配，不含任何额外空格
                  </li>
                  <li>
                    如果长时间无法验证成功，请检查DNS记录是否已生效（可使用{" "}
                    <a
                      href={`https://dnschecker.org/#TXT/_kedaya.${newDomain.domainName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      DNSChecker
                    </a>{" "}
                    或{" "}
                    <a
                      href={`https://toolbox.googleapps.com/apps/dig/#TXT/_kedaya.${newDomain.domainName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Google Dig
                    </a>
                    工具查询）
                  </li>
                </ul>
              </div>

              {/* Vercel域名验证部分 */}
              {newDomain && newDomain.vercel && (
                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
                  <h3 className="mb-2 font-semibold">Vercel域名验证</h3>
                  <p className="mb-2 text-sm">
                    您还需要完成Vercel域名验证，否则域名生效后会显示404错误。
                  </p>
                  
                  {newDomain.vercel.error ? (
                    <div className="text-sm text-red-600">
                      Vercel绑定错误: {newDomain.vercel.error}
                    </div>
                  ) : newDomain.vercel.verified ? (
                    <div className="text-sm text-green-600">Vercel域名已验证，无需额外操作。</div>
                  ) : (
                    <>
                      {newDomain.vercel.config && (
                        <div className="space-y-2">
                          <div className="rounded-md bg-slate-100 p-3 dark:bg-slate-800">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="font-medium">记录类型:</div>
                              <div>
                                {newDomain.vercel.config.expectedVerificationRecords?.[0]?.type || "TXT"}
                              </div>
                              <div className="font-medium">主机记录:</div>
                              <div className="break-all font-mono text-green-600">
                                {newDomain.vercel.config.expectedVerificationRecords?.[0]?.name || "_vercel"}
                              </div>
                              <div className="font-medium">记录值:</div>
                              <div className="break-all font-mono text-green-600">
                                {newDomain.vercel.config.expectedVerificationRecords?.[0]?.value}
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            需要添加上述DNS记录以验证您在Vercel的域名所有权
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setNewDomain(null);
                  if (onSuccess) onSuccess();
                  setShowForm(false);
                }}
              >
                返回列表
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  try {
                    setIsSubmitting(true);
                    console.log('🔵 开始验证域名:', newDomain.id);
                    
                    const response = await fetch(`/api/custom-domain/update`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: newDomain.id }),
                    });

                    const result = await response.json();
                    console.log('🔵 域名验证响应:', result);
                    
                    if (result.status === "success") {
                      console.log('✅ 域名验证成功');
                      toast.success("域名验证成功");
                      if (onSuccess) onSuccess();
                      setShowForm(false);
                    } else {
                      console.error('❌ 域名验证失败:', result);
                      toast.error(result.message || "域名验证失败");
                    }
                  } catch (error) {
                    console.error('❌ 验证请求失败:', error);
                    toast.error("验证请求失败");
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Icons.spinner className="mr-2 size-4 animate-spin" />
                )}
                验证域名
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <Card>
        <CardHeader>
          <CardTitle>{initData ? "编辑域名" : "添加域名"}</CardTitle>
          <CardDescription>
            {initData
              ? "修改您的自定义域名设置"
              : "添加您自己的域名到系统中"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-2 rounded-md border p-4 dark:border-slate-700">
            <h3 className="text-sm font-semibold">DNS验证说明</h3>
            <p className="text-sm text-muted-foreground">
              使用DNS验证方式添加域名，您需要按照以下步骤进行：
            </p>
            <ol className="ml-5 list-decimal text-sm text-muted-foreground">
              <li>添加您的域名</li>
              <li>系统会生成一个唯一的验证密钥</li>
              <li>在您的DNS管理面板中添加一条TXT记录：
                <code className="ml-2 rounded bg-secondary p-1 text-xs">
                  _kedaya.您的域名 TXT 验证密钥
                </code>
              </li>
              <li>等待记录生效后点击验证按钮</li>
            </ol>
            <p className="text-sm text-muted-foreground">
              提交后，系统会为您生成详细的验证指南。
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="domainName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      域名
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="ml-1 cursor-help">
                            <Icons.help className="size-4" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>
                              请输入您的域名，例如"example.com"。不需要添加http://或https://前缀。
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="example.com"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      您的完整域名，不包含子域部分。
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  取消
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Icons.spinner className="mr-2 size-4 animate-spin" />
                  )}
                  {initData ? "更新" : "添加"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 