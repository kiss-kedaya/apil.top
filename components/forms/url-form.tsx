"use client";

import { Dispatch, SetStateAction, useTransition, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "@prisma/client";
import { Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { siteConfig } from "@/config/site";
import { ShortUrlFormData } from "@/lib/dto/short-urls";
import { EXPIRATION_ENUMS } from "@/lib/enums";
import { generateUrlSuffix } from "@/lib/utils";
import { createUrlSchema } from "@/lib/validations/url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/shared/icons";
import DomainSelector from "@/components/shared/DomainSelector";

import { FormSectionColumns } from "../dashboard/form-section-columns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export type FormData = ShortUrlFormData;

export type FormType = "add" | "edit";

export interface RecordFormProps {
  user: Pick<User, "id" | "name">;
  isShowForm: boolean;
  setShowForm: Dispatch<SetStateAction<boolean>>;
  type: FormType;
  initData?: ShortUrlFormData | null;
  action: string;
  onRefresh: () => void;
}

export function UrlForm({
  setShowForm,
  type,
  initData,
  action,
  onRefresh,
}: RecordFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors },
    getValues,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(createUrlSchema),
    defaultValues: {
      id: initData?.id || "",
      target: initData?.target || "",
      url: initData?.url || "",
      active: initData?.active || 1,
      prefix: initData?.prefix || siteConfig.shortDomains[0],
      visible: initData?.visible || 0,
      expiration: initData?.expiration || "-1",
      password: initData?.password || "",
    },
  });

  const onSubmit = handleSubmit((data) => {
    if (type === "add") {
      handleCreateUrl(data);
    } else if (type === "edit") {
      handleUpdateUrl(data);
    }
  });

  const handleCreateUrl = async (data: ShortUrlFormData) => {
    if (data.password !== "" && data.password.length !== 6) {
      toast.error("密码必须是6位字符!");
      return;
    }
    startTransition(async () => {
      const response = await fetch(`${action}/add`, {
        method: "POST",
        body: JSON.stringify({
          data,
        }),
      });
      if (!response.ok || response.status !== 200) {
        toast.error("创建失败!", {
          description: await response.text(),
        });
      } else {
        toast.success(`创建成功!`);
        setShowForm(false);
        onRefresh();
      }
    });
  };

  const handleUpdateUrl = async (data: ShortUrlFormData) => {
    if (data.password !== "" && data.password.length !== 6) {
      toast.error("密码必须是6位字符!");
      return;
    }
    startTransition(async () => {
      if (type === "edit") {
        const response = await fetch(`${action}/update`, {
          method: "POST",
          body: JSON.stringify({ data, userId: initData?.userId }),
        });
        if (!response.ok || response.status !== 200) {
          toast.error("更新失败", {
            description: await response.text(),
          });
        } else {
          const res = await response.json();
          toast.success(`更新成功!`);
          setShowForm(false);
          onRefresh();
        }
      }
    });
  };

  const handleDeleteUrl = async () => {
    if (type === "edit") {
      startTransition(async () => {
        const response = await fetch(`${action}/delete`, {
          method: "POST",
          body: JSON.stringify({
            url_id: initData?.id,
            userId: initData?.userId,
          }),
        });
        if (!response.ok || response.status !== 200) {
          toast.error("删除失败", {
            description: await response.text(),
          });
        } else {
          await response.json();
          toast.success(`删除成功`);
          setShowForm(false);
          onRefresh();
        }
      });
    }
  };

  return (
    <div className="mb-4 rounded-lg border border-dashed shadow-sm animate-in fade-in-50">
      <div className="rounded-t-lg bg-muted px-4 py-2 text-lg font-semibold">
        {type === "add" ? "创建" : "编辑"} 短链接
      </div>
      <form className="p-4" onSubmit={onSubmit}>
        <div className="items-center justify-start gap-4 md:flex">
          <FormSectionColumns title="目标URL">
            <div className="flex w-full items-center gap-2">
              <Label className="sr-only" htmlFor="target">
                目标
              </Label>
              <Input
                id="target"
                className="flex-1 shadow-inner"
                size={32}
                {...register("target")}
              />
            </div>
            <div className="flex flex-col justify-between p-1">
              {errors?.target ? (
                <p className="pb-0.5 text-[13px] text-red-600">
                  {errors.target.message}
                </p>
              ) : (
                <p className="pb-0.5 text-[13px] text-muted-foreground">
                  必填项。格式：https://your-origin-url
                </p>
              )}
            </div>
          </FormSectionColumns>
          <FormSectionColumns title="短链接">
            <div className="flex w-full items-center gap-2">
              <Label className="sr-only" htmlFor="url">
                链接
              </Label>

              <div className="relative flex items-center">
                <DomainSelector
                  type="shortlink"
                  defaultValue={initData?.prefix || siteConfig.shortDomains[0]}
                  onChange={(value) => setValue("prefix", value)}
                  disabled={type === "edit"}
                  triggerClassName="w-1/3 rounded-r-none border-r-0 shadow-inner"
                />
                
                <span className="pointer-events-none absolute left-[calc(33%-8px)] text-sm text-muted-foreground">/</span>
                
                <Input
                  id="url"
                  className="flex-1 rounded-l-none shadow-inner"
                  autoComplete="off"
                  disabled={type === "edit"}
                  {...register("url")}
                />
                
                {type === "add" && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="absolute right-1 h-7 w-7 rounded-full p-0"
                    onClick={() => {
                      setValue("url", generateUrlSuffix());
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span className="sr-only">生成随机短码</span>
                  </Button>
                )}
              </div>
            </div>
            <div className="flex flex-col justify-between p-1">
              {errors?.url ? (
                <p className="pb-0.5 text-[13px] text-red-600">
                  {errors.url.message}
                </p>
              ) : (
                <p className="pb-0.5 text-[13px] text-muted-foreground">
                  必填项。只能包含字母、数字和连字符。
                </p>
              )}
            </div>
          </FormSectionColumns>
        </div>

        <div className="items-center justify-start gap-4 md:flex">
          <FormSectionColumns title="密码 (可选)">
            <div className="flex w-full items-center gap-2">
              <Label className="sr-only" htmlFor="password">
                密码
              </Label>
              <Input
                id="password"
                className="flex-1 shadow-inner"
                size={32}
                maxLength={6}
                type="password"
                placeholder="输入6位字符密码"
                {...register("password")}
              />
            </div>
            <div className="flex flex-col justify-between p-1">
              {errors?.password ? (
                <p className="pb-0.5 text-[13px] text-red-600">
                  {errors.password.message}
                </p>
              ) : (
                <p className="pb-0.5 text-[13px] text-muted-foreground">
                  可选。如果你想要保护你的链接。
                </p>
              )}
            </div>
          </FormSectionColumns>
          <FormSectionColumns title="过期时间">
            <Select
              onValueChange={(value: string) => {
                setValue("expiration", value);
              }}
              name="expiration"
              defaultValue={initData?.expiration || "-1"}
            >
              <SelectTrigger className="w-full shadow-inner">
                <SelectValue placeholder="选择时间" />
              </SelectTrigger>
              <SelectContent>
                {EXPIRATION_ENUMS.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="p-1 text-[13px] text-muted-foreground">
              过期时间，默认永不。
            </p>
          </FormSectionColumns>
        </div>

        {/* Action buttons */}
        <div className="mt-3 flex justify-end gap-3">
          {type === "edit" && (
            <Button
              type="button"
              variant="destructive"
              className="mr-auto w-[80px] px-0"
              onClick={() => handleDeleteUrl()}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Icons.spinner className="size-4 animate-spin" />
              ) : (
                <p>删除</p>
              )}
            </Button>
          )}
          <Button
            type="reset"
            variant="outline"
            className="w-[80px] px-0"
            onClick={() => setShowForm(false)}
          >
            取消
          </Button>
          <Button
            type="submit"
            variant="blue"
            disabled={isPending}
            className="w-[80px] shrink-0 px-0"
          >
            {isPending ? (
              <Icons.spinner className="size-4 animate-spin" />
            ) : (
              <p>{type === "edit" ? "更新" : "保存"}</p>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
