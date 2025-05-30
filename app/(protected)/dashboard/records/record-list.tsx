"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User } from "@prisma/client";
import { PenLine, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";
import useSWR, { useSWRConfig } from "swr";

import { UserRecordFormData } from "@/lib/dto/cloudflare-dns-record";
import { TTL_ENUMS } from "@/lib/enums";
import { fetcher, timeAgo } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FormType, RecordForm } from "@/components/forms/record-form";
import { EmptyPlaceholder } from "@/components/shared/empty-placeholder";
import { Icons } from "@/components/shared/icons";
import { LinkPreviewer } from "@/components/shared/link-previewer";
import { PaginationWrapper } from "@/components/shared/pagination";

export interface RecordListProps {
  user: Pick<User, "id" | "name" | "apiKey">;
  action: string;
}

function TableColumnSekleton() {
  return (
    <TableRow className="grid grid-cols-3 items-center sm:grid-cols-9">
      <TableCell className="col-span-1">
        <Skeleton className="h-5 w-24" />
      </TableCell>
      <TableCell className="col-span-1">
        <Skeleton className="h-5 w-24" />
      </TableCell>
      <TableCell className="col-span-2 hidden sm:inline-block">
        <Skeleton className="h-5 w-24" />
      </TableCell>
      <TableCell className="col-span-1 hidden sm:inline-block">
        <Skeleton className="h-5 w-16" />
      </TableCell>
      <TableCell className="col-span-1 hidden justify-center sm:flex">
        <Skeleton className="h-5 w-16" />
      </TableCell>
      <TableCell className="col-span-1 hidden justify-center sm:flex">
        <Skeleton className="h-5 w-16" />
      </TableCell>
      <TableCell className="col-span-1 hidden justify-center sm:flex">
        <Skeleton className="h-5 w-16" />
      </TableCell>
      <TableCell className="col-span-1 flex justify-center">
        <Skeleton className="h-5 w-16" />
      </TableCell>
    </TableRow>
  );
}

export default function UserRecordsList({ user, action }: RecordListProps) {
  const [isShowForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<FormType>("add");
  const [currentEditRecord, setCurrentEditRecord] =
    useState<UserRecordFormData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { mutate } = useSWRConfig();

  const { data, error, isLoading } = useSWR<{
    total: number;
    list: UserRecordFormData[];
  }>(`${action}?page=${currentPage}&size=${pageSize}`, fetcher, {
    revalidateOnFocus: false,
  });

  const handleRefresh = () => {
    mutate(`${action}?page=${currentPage}&size=${pageSize}`, undefined);
  };

  const handleDNSRecordChange = async (
    checked: boolean,
    record: UserRecordFormData,
    setChecked: (value: boolean) => void,
    changeType: "status" | "proxy"
  ) => {
    const originalState = changeType === "status" ? record.active === 1 : record.proxied;
    setChecked(checked); // 立即更新 UI
    
    try {
      // 构建请求参数
      const params: any = {
        zone_id: record.zone_id,
        record_id: record.record_id,
        target: record.name
      };
      
      // 根据更改类型设置不同的参数
      if (changeType === "status") {
        params.active = checked ? 1 : 0;
      } else {
        params.proxied = checked;
        // 如果开启代理，确保状态也是开启的
        if (checked && record.active === 0) {
          params.active = 1;
        }
      }

      const res = await fetch(`/api/record/update`, {
        method: "PUT",
        body: JSON.stringify(params),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.message) {
          if (data.message.includes("不可访问")) {
            toast.warning(data.message, {
              description: "您可以保持开启，但在目标可访问前DNS解析可能不生效"
            });
          } else {
            toast.success(data.message);
          }
          
          // 如果返回了新记录ID，刷新页面
          if (data.record_id) {
            handleRefresh();
          }
        } else {
          setChecked(originalState);
          toast.warning("接收到未知响应格式，请刷新页面重试");
        }
      } else {
        setChecked(originalState);
        toast.error("更新失败，请稍后重试");
      }
    } catch (error) {
      console.error(`${changeType === "status" ? "状态" : "代理"}切换错误:`, error);
      setChecked(originalState);
      toast.error("发生错误，请稍后重试");
    }
  };

  return (
    <>
      <Card className="xl:col-span-2">
        <CardHeader className="flex flex-row items-center">
          {action.includes("/admin") ? (
            <CardDescription className="text-balance text-lg font-bold">
              <span>记录总数：</span>{" "}
              <span className="font-bold">{data && data.total}</span>
            </CardDescription>
          ) : (
            <div className="grid gap-2">
              <CardTitle>DNS记录</CardTitle>
              <CardDescription className="hidden text-balance sm:block">
                使用前请阅读{" "}
                <Link
                  target="_blank"
                  className="font-semibold text-yellow-600 after:content-['↗'] hover:underline"
                  href="/docs/dns-records#legitimacy-review"
                >
                  合法性审查
                </Link>{" "}
                。查看{" "}
                <Link
                  target="_blank"
                  className="text-blue-500 hover:underline"
                  href="/docs/examples/vercel"
                >
                  示例
                </Link>{" "}
                了解更多用法。
              </CardDescription>
            </div>
          )}
          <div className="ml-auto flex items-center justify-end gap-3">
            <Button
              variant={"outline"}
              onClick={() => handleRefresh()}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCwIcon className="size-4 animate-spin" />
              ) : (
                <RefreshCwIcon className="size-4" />
              )}
            </Button>
            <Button
              className="w-[120px] shrink-0 gap-1"
              variant="default"
              onClick={() => {
                setCurrentEditRecord(null);
                setShowForm(false);
                setFormType("add");
                setShowForm(!isShowForm);
              }}
            >
              添加记录
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isShowForm && (
            <RecordForm
              user={{ id: user.id, name: user.name || "" }}
              isShowForm={isShowForm}
              setShowForm={setShowForm}
              type={formType}
              initData={currentEditRecord}
              action={action}
              onRefresh={handleRefresh}
            />
          )}
          <Table>
            <TableHeader className="bg-gray-100/50 dark:bg-primary-foreground">
              <TableRow className="grid grid-cols-3 items-center sm:grid-cols-9">
                <TableHead className="col-span-1 flex items-center font-bold">
                  类型
                </TableHead>
                <TableHead className="col-span-1 flex items-center font-bold">
                  名称
                </TableHead>
                <TableHead className="col-span-2 hidden items-center font-bold sm:flex">
                  内容
                </TableHead>
                <TableHead className="col-span-1 hidden items-center font-bold sm:flex">
                  TTL
                </TableHead>
                <TableHead className="col-span-1 hidden items-center justify-center font-bold sm:flex">
                  状态
                </TableHead>
                <TableHead className="col-span-1 hidden items-center justify-center font-bold sm:flex">
                  代理
                </TableHead>
                <TableHead className="col-span-1 hidden items-center justify-center font-bold sm:flex">
                  更新时间
                </TableHead>
                <TableHead className="col-span-1 flex items-center justify-center font-bold">
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <>
                  <TableColumnSekleton />
                  <TableColumnSekleton />
                  <TableColumnSekleton />
                  <TableColumnSekleton />
                  <TableColumnSekleton />
                </>
              ) : data && data.list && data.list.length ? (
                data.list.map((record) => (
                  <TableRow
                    key={record.id}
                    className="grid animate-fade-in grid-cols-3 items-center animate-in sm:grid-cols-9"
                  >
                    <TableCell className="col-span-1">
                      <Badge className="text-xs" variant="outline">
                        {record.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="col-span-1">
                      <TooltipProvider>
                        <Tooltip delayDuration={200}>
                          <TooltipTrigger>
                            <span className="max-w-20 truncate">
                              {record.name?.slice(0, 16) + "..."}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{record.name}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="col-span-2 hidden pr-0 sm:flex">
                      <TooltipProvider>
                        <Tooltip delayDuration={200}>
                          <TooltipTrigger>
                            <span className="max-w-36 truncate">
                              {record.content}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{record.content}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="col-span-1 hidden sm:flex">
                      <span
                        className={
                          record.ttl === 1
                            ? "text-xs text-orange-500"
                            : "text-xs text-blue-500"
                        }
                      >
                        {record.ttl === 1
                          ? "自动"
                          : TTL_ENUMS.find((t) => t.value === String(record.ttl))
                              ?.label || record.ttl}
                      </span>
                    </TableCell>
                    <TableCell className="col-span-1 hidden justify-center sm:flex">
                      <StatusSwitchWrapper record={record} onChangeStatu={handleDNSRecordChange} />
                    </TableCell>
                    <TableCell className="col-span-1 hidden justify-center sm:flex">
                      <ProxySwitchWrapper record={record} onChangeStatu={handleDNSRecordChange} />
                    </TableCell>
                    <TableCell className="col-span-1 hidden justify-center sm:flex">
                      {timeAgo(record.modified_on as unknown as Date)}
                    </TableCell>
                    <TableCell className="col-span-1 flex justify-center">
                      <Button
                        className="h-7 px-1 text-xs hover:bg-slate-100 dark:hover:text-primary-foreground"
                        size="sm"
                        variant={"outline"}
                        onClick={() => {
                          setCurrentEditRecord(record);
                          setShowForm(false);
                          setFormType("edit");
                          setShowForm(!isShowForm);
                          if (!isShowForm) {
                            window.scrollTo({
                              top: 0,
                              behavior: "smooth",
                            });
                          }
                        }}
                      >
                        <p className="hidden sm:block">编辑</p>
                        <PenLine className="mx-0.5 size-4 sm:ml-1 sm:size-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <EmptyPlaceholder>
                  <EmptyPlaceholder.Icon name="globe" />
                  <EmptyPlaceholder.Title>没有记录</EmptyPlaceholder.Title>
                  <EmptyPlaceholder.Description>
                    您还没有任何DNS记录。开始创建记录吧。
                  </EmptyPlaceholder.Description>
                </EmptyPlaceholder>
              )}
            </TableBody>
            {data && Math.ceil(data.total / pageSize) > 1 && (
              <PaginationWrapper
                total={Math.ceil(data.total / pageSize)}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            )}
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

// 仅处理状态切换的组件
const StatusSwitchWrapper = ({
  record,
  onChangeStatu,
}: {
  record: UserRecordFormData;
  onChangeStatu: (
    checked: boolean,
    record: UserRecordFormData,
    setChecked: (value: boolean) => void,
    changeType: "status" | "proxy"
  ) => Promise<void>;
}) => {
  const [checked, setChecked] = useState(record.active === 1);

  return (
    <div className="flex items-center gap-1">
      <Switch
        className="data-[state=checked]:bg-blue-500"
        checked={checked}
        onCheckedChange={(value) => onChangeStatu(value, record, setChecked, "status")}
      />
      <span className="text-xs ml-1">{checked ? "开启" : "关闭"}</span>
    </div>
  );
};

// 仅处理代理切换的组件
const ProxySwitchWrapper = ({
  record,
  onChangeStatu,
}: {
  record: UserRecordFormData;
  onChangeStatu: (
    checked: boolean,
    record: UserRecordFormData,
    setChecked: (value: boolean) => void,
    changeType: "status" | "proxy"
  ) => Promise<void>;
}) => {
  const [isProxied, setIsProxied] = useState(record.proxied);
  const [isActive, setIsActive] = useState(record.active === 1);
  const [isLoading, setIsLoading] = useState(false);

  // 当状态发生变化时，更新活跃状态
  useEffect(() => {
    setIsActive(record.active === 1);
  }, [record.active]);

  const handleProxyToggle = async (proxyValue: boolean) => {
    try {
      setIsLoading(true);
      await onChangeStatu(proxyValue, record, setIsProxied, "proxy");
      // 如果代理被开启，那么状态也应该被开启
      if (proxyValue && !isActive) {
        setIsActive(true);
      }
    } catch (error) {
      console.error("代理切换失败:", error);
      toast.error("代理状态切换失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Switch
        className="data-[state=checked]:bg-orange-500"
        checked={isProxied}
        disabled={isLoading || !isActive}
        onCheckedChange={handleProxyToggle}
      />
      <span className="text-xs ml-1">
        {isLoading ? "更新中..." : isProxied ? "代理" : "直连"}
      </span>
    </div>
  );
};
