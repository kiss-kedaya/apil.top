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