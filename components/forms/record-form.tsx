"use client";

import { Dispatch, SetStateAction, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "@prisma/client";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { CreateDNSRecord, RecordType } from "@/lib/cloudflare";
import { UserRecordFormData } from "@/lib/dto/cloudflare-dns-record";
import { RECORD_TYPE_ENUMS, TTL_ENUMS } from "@/lib/enums";
import { createRecordSchema } from "@/lib/validations/record";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/shared/icons";
import { Switch } from "@/components/ui/switch";

import { FormSectionColumns } from "../dashboard/form-section-columns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export type FormData = CreateDNSRecord;

export type FormType = "add" | "edit";

export interface RecordFormProps {
  user: Pick<User, "id" | "name">;
  isShowForm: boolean;
  setShowForm: Dispatch<SetStateAction<boolean>>;
  type: FormType;
  initData?: UserRecordFormData | null;
  action: string;
  onRefresh: () => void;
}

export function RecordForm({
  user,
  isShowForm,
  setShowForm,
  type,
  initData,
  action,
  onRefresh,
}: RecordFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [currentRecordType, setCurrentRecordType] = useState(
    initData?.type || "CNAME",
  );

  const {
    handleSubmit,
    register,
    formState: { errors },
    getValues,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(createRecordSchema),
    defaultValues: {
      type: initData?.type || "CNAME",
      ttl: initData?.ttl || 1,
      proxied: initData?.proxied || false,
      comment: initData?.comment || "",
      name:
        (initData?.name.endsWith(".apil.top")
          ? initData?.name.slice(0, -6)
          : initData?.name) || "",
      content: initData?.content || "",
    },
  });

  const onSubmit = handleSubmit((data) => {
    if (type === "add") {
      handleCreateRecord(data);
    } else if (type === "edit") {
      handleUpdateRecord(data);
    }
  });

  const handleCreateRecord = async (data: CreateDNSRecord) => {
    startTransition(async () => {
      const response = await fetch(`${action}/add`, {
        method: "POST",
        body: JSON.stringify({
          records: [data],
        }),
      });

      if (!response.ok || response.status !== 200) {
        toast.error("创建失败！", {
          description: await response.text(),
        });
      } else {
        toast.success(`创建成功！`);
        setShowForm(false);
        onRefresh();
      }
    });
  };

  const handleUpdateRecord = async (data: CreateDNSRecord) => {
    startTransition(async () => {
      if (type === "edit") {
        const response = await fetch(`${action}/update`, {
          method: "POST",
          body: JSON.stringify({
            recordId: initData?.record_id,
            record: data,
            userId: initData?.userId,
          }),
        });
        if (!response.ok || response.status !== 200) {
          toast.error("更新失败", {
            description: await response.text(),
          });
        } else {
          const res = await response.json();
          toast.success(`更新成功！`);
          setShowForm(false);
          onRefresh();
        }
      }
    });
  };

  const handleDeleteRecord = async () => {
    if (type === "edit") {
      startDeleteTransition(async () => {
        const response = await fetch(`${action}/delete`, {
          method: "POST",
          body: JSON.stringify({
            record_id: initData?.record_id,
            zone_id: initData?.zone_id,
            active: initData?.active,
            userId: initData?.userId,
          }),
        });
        if (!response.ok) {
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
        {type === "add" ? "创建" : "编辑"} 记录
      </div>
      <form className="p-4" onSubmit={onSubmit}>
        <div className="items-center justify-start gap-4 md:flex">
          <FormSectionColumns title="类型">
            <Select
              onValueChange={(value: RecordType) => {
                setValue("type", value);
                setCurrentRecordType(value);
              }}
              name={"type"}
              defaultValue={initData?.type || "CNAME"}
            >
              <SelectTrigger className="w-full shadow-inner">
                <SelectValue placeholder="选择类型" />
              </SelectTrigger>
              <SelectContent>
                {RECORD_TYPE_ENUMS.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="p-1 text-[13px] text-muted-foreground">必填项。</p>
          </FormSectionColumns>
          <FormSectionColumns title="名称">
            <div className="flex w-full items-center gap-2">
              <Label className="sr-only" htmlFor="name">
                名称 (必填)
              </Label>
              <div className="relative">
                <Input
                  id="name"
                  className="flex-1 shadow-inner"
                  size={32}
                  {...register("name")}
                />
                {currentRecordType === "CNAME" ||
                  (currentRecordType === "A" && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                      .apil.top
                    </span>
                  ))}
              </div>
            </div>
            <div className="flex flex-col justify-between p-1">
              {errors?.name ? (
                <p className="pb-0.5 text-[13px] text-red-600">
                  {errors.name.message}
                </p>
              ) : (
                <p className="pb-0.5 text-[13px] text-muted-foreground">
                  必填项。使用 @ 表示根域名。
                </p>
              )}
            </div>
          </FormSectionColumns>
          <FormSectionColumns
            title={
              currentRecordType === "CNAME"
                ? "内容"
                : currentRecordType === "A"
                  ? "IPv4 地址"
                  : "内容"
            }
          >
            <div className="flex w-full items-center gap-2">
              <Label className="sr-only" htmlFor="content">
                内容
              </Label>
              <Input
                id="content"
                className="flex-1 shadow-inner"
                size={32}
                {...register("content")}
              />
            </div>
            <div className="flex flex-col justify-between p-1">
              {errors?.content ? (
                <p className="pb-0.5 text-[13px] text-red-600">
                  {errors.content.message}
                </p>
              ) : (
                <p className="pb-0.5 text-[13px] text-muted-foreground">
                  {currentRecordType === "CNAME"
                    ? "必填项。例如: www.example.com"
                    : currentRecordType === "A"
                      ? "必填项。例如: 8.8.8.8"
                      : "必填项。"}
                </p>
              )}
            </div>
          </FormSectionColumns>
        </div>

        <div className="mt-4 items-start justify-start gap-4 md:flex">
          <FormSectionColumns title="TTL">
            <Select
              onValueChange={(value: string) => {
                setValue("ttl", parseInt(value));
              }}
              name={"ttl"}
              defaultValue={String(initData?.ttl) || "1"}
            >
              <SelectTrigger className="w-full shadow-inner">
                <SelectValue placeholder="选择 TTL" />
              </SelectTrigger>
              <SelectContent>
                {TTL_ENUMS.map((ttl) => (
                  <SelectItem key={ttl.value} value={ttl.value}>
                    {ttl.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="p-1 text-[13px] text-muted-foreground">
              缓存生存时间。
            </p>
          </FormSectionColumns>
          <FormSectionColumns title="代理">
            <div className="flex w-full items-center gap-2">
              <Label className="sr-only" htmlFor="proxied">
                代理
              </Label>
              <div className="flex items-center">
                <Switch
                  id="proxied"
                  checked={getValues("proxied")}
                  onCheckedChange={(checked) => {
                    setValue("proxied", checked);
                  }}
                  className="data-[state=checked]:bg-orange-500"
                />
                <span className="ml-2 text-sm">
                  {getValues("proxied") ? "代理" : "直连"}
                </span>
              </div>
            </div>
            <p className="p-1 text-[13px] text-muted-foreground">
              开启后流量通过Cloudflare代理，可以获得安全防护和CDN加速，但可能有兼容性问题。
            </p>
          </FormSectionColumns>
          <FormSectionColumns title="备注">
            <div className="flex w-full items-center gap-2">
              <Label className="sr-only" htmlFor="comment">
                备注
              </Label>
              <Input
                id="comment"
                className="flex-1 shadow-inner"
                placeholder="选填"
                size={32}
                {...register("comment")}
              />
            </div>
            <div className="flex flex-col justify-between p-1">
              <p className="pb-0.5 text-[13px] text-muted-foreground">
                可选备注信息。
              </p>
            </div>
          </FormSectionColumns>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowForm(false);
            }}
            type="button"
          >
            取消
          </Button>
          <Button
            variant={type === "add" ? "default" : "outline"}
            disabled={isPending}
            type="submit"
          >
            {isPending ? (
              <Icons.spinner className="mr-2 size-4 animate-spin" />
            ) : type === "add" ? (
              "创建"
            ) : (
              "更新"
            )}
          </Button>
          {type === "edit" && (
            <Button
              variant="destructive"
              onClick={() => {
                if (
                  window.confirm("确定要删除这条记录吗？此操作无法撤销。")
                ) {
                  handleDeleteRecord();
                }
              }}
              type="button"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Icons.spinner className="mr-2 size-4 animate-spin" />
              ) : (
                "删除"
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
