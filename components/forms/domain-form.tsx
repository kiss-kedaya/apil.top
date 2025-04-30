"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

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
        try {
          const response = await fetch(`/api/custom-domain/check-verification`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: newDomain.id }),
          });
          
          const data = await response.json();
          if (data.status === "success") {
            setVerificationStatus(data.data);
          }
        } catch (error) {
          console.error("检查验证状态出错:", error);
        }
      };
      
      checkVerificationStatus();
    }
  }, [newDomain]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    try {
      const url = initData
        ? `/api/custom-domain/update`
        : `/api/custom-domain`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          initData ? { ...values, id: initData.id } : values
        ),
      });

      const data = await response.json();

      if (data.status === "success") {
        toast.success(
          initData
            ? "域名更新成功"
            : "域名添加成功，请按照指引完成域名验证"
        );
        if (data.data && !initData) {
          setNewDomain(data.data); // 保存新添加的域名信息，用于显示验证指南
        } else {
          if (onSuccess) onSuccess();
          setShowForm(false);
          form.reset();
        }
      } else {
        toast.error(data.message || "操作失败");
      }
    } catch (error) {
      console.error("提交表单出错:", error);
      toast.error("提交表单出错");
    } finally {
      setIsSubmitting(false);
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
              <Icons.info className="h-5 w-5" />
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
                    const response = await fetch(`/api/custom-domain/update`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: newDomain.id }),
                    });

                    const result = await response.json();
                    if (result.status === "success") {
                      toast.success("域名验证成功");
                      if (onSuccess) onSuccess();
                      setShowForm(false);
                    } else {
                      toast.error(result.message || "域名验证失败");
                    }
                  } catch (error) {
                    toast.error("验证请求失败");
                    console.error(error);
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