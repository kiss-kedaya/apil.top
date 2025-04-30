"use client";

import { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Icons } from "@/components/shared/icons";

const formSchema = z.object({
  domainName: z.string().min(3, {
    message: "域名必须至少为3个字符。",
  }),
  isCloudflare: z.boolean().default(true),
  // 以下字段在非Cloudflare模式下必填
  zoneId: z.string().optional(),
  apiKey: z.string().optional(),
  email: z.string().email().optional(),
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
  const [domainType, setDomainType] = useState(
    initData ? (initData.isCloudflare ? "cloudflare" : "selfhosted") : "cloudflare"
  );

  // 表单默认值
  const defaultValues = initData
    ? {
        domainName: initData.domainName,
        isCloudflare: initData.isCloudflare,
        zoneId: initData.zoneId || "",
        apiKey: initData.apiKey || "",
        email: initData.email || "",
      }
    : {
        domainName: "",
        isCloudflare: true,
        zoneId: "",
        apiKey: "",
        email: "",
      };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    // 更新isCloudflare字段
    values.isCloudflare = domainType === "cloudflare";

    // 根据domainType验证表单
    if (domainType === "selfhosted") {
      if (!values.zoneId || !values.apiKey || !values.email) {
        toast.error("自托管域名需要填写Zone ID、API密钥和邮箱");
        setIsSubmitting(false);
        return;
      }
    }

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
        if (onSuccess) onSuccess();
        setShowForm(false);
        form.reset();
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
          <Tabs
            value={domainType}
            onValueChange={setDomainType}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cloudflare">Cloudflare方式</TabsTrigger>
              <TabsTrigger value="selfhosted">自托管方式</TabsTrigger>
            </TabsList>
            <TabsContent value="cloudflare" className="mt-4">
              <div className="mb-4 space-y-2 rounded-md border p-4 dark:border-slate-700">
                <h3 className="text-sm font-semibold">Cloudflare配置说明</h3>
                <p className="text-sm text-muted-foreground">
                  使用Cloudflare方式添加域名，您需要在Cloudflare上配置您的域名，并按照以下步骤进行：
                </p>
                <ol className="ml-5 list-decimal text-sm text-muted-foreground">
                  <li>在Cloudflare上注册或登录您的账户</li>
                  <li>添加您的域名到Cloudflare</li>
                  <li>在DNS设置中添加记录，指向我们的服务器</li>
                  <li>
                    添加一条TXT记录用于验证域名所有权：
                    <code className="ml-2 rounded bg-secondary p-1 text-xs">
                      _kedaya.您的域名 TXT 验证密钥
                    </code>
                  </li>
                </ol>
                <p className="text-sm text-muted-foreground">
                  提交后，系统会为您生成一个验证密钥，您需要将其添加到Cloudflare的DNS记录中。
                </p>
              </div>
            </TabsContent>
            <TabsContent value="selfhosted" className="mt-4">
              <div className="mb-4 space-y-2 rounded-md border p-4 dark:border-slate-700">
                <h3 className="text-sm font-semibold">自托管配置说明</h3>
                <p className="text-sm text-muted-foreground">
                  使用自托管方式添加域名，您需要提供您的DNS服务提供商的API信息，并按照以下步骤进行：
                </p>
                <ol className="ml-5 list-decimal text-sm text-muted-foreground">
                  <li>获取您的DNS服务提供商的Zone ID</li>
                  <li>创建API密钥，确保有足够的权限修改DNS记录</li>
                  <li>
                    提供与API密钥关联的邮箱地址（通常是您的账户邮箱）
                  </li>
                </ol>
                <p className="text-sm text-muted-foreground">
                  自托管方式需要您提供更多信息，但可以使用任何DNS服务提供商，而不仅限于Cloudflare。
                </p>
              </div>
            </TabsContent>
          </Tabs>

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

              {domainType === "selfhosted" && (
                <>
                  <FormField
                    control={form.control}
                    name="zoneId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zone ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="abcdef1234567890abcdef"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          您的DNS服务提供商的区域ID。
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API密钥</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="您的API密钥"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          用于验证API请求的密钥。
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>关联邮箱</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="user@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          与API密钥关联的电子邮件地址。
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

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