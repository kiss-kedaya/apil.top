"use client";

import { useState } from "react";
import Link from "next/link";
import { UserRole } from "@prisma/client";
import { RefreshCwIcon, ShieldAlertIcon, ShieldCheckIcon } from "lucide-react";
import { toast } from "sonner";
import useSWR, { useSWRConfig } from "swr";

import { TeamPlanQuota } from "@/config/team";
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
import { EmptyPlaceholder } from "@/components/shared/empty-placeholder";
import { DomainForm } from "@/components/forms/domain-form";

export interface UserCustomDomainData {
  id: string;
  userId: string;
  domainName: string;
  verificationKey?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomDomainListProps {
  user: {
    id: string;
    name: string;
    role: UserRole;
    team: string;
  };
  action: string;
}

function TableColumnSkeleton() {
  return (
    <TableRow className="grid grid-cols-3 items-center sm:grid-cols-5">
      <TableCell className="col-span-1">
        <Skeleton className="h-5 w-24" />
      </TableCell>
      <TableCell className="col-span-1">
        <Skeleton className="h-5 w-24" />
      </TableCell>
      <TableCell className="col-span-1 hidden sm:inline-block">
        <Skeleton className="h-5 w-24" />
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

export default function CustomDomainsList({ user, action }: CustomDomainListProps) {
  const [isShowForm, setShowForm] = useState(false);
  const [currentEditDomain, setCurrentEditDomain] = useState<UserCustomDomainData | null>(null);

  const { mutate } = useSWRConfig();

  const { data, error, isLoading } = useSWR<{
    status: string;
    data: UserCustomDomainData[];
  }>(action, fetcher, {
    revalidateOnFocus: false,
  });

  const handleRefresh = () => {
    mutate(action, undefined);
  };

  // 验证域名是否已经绑定
  const verifyDomain = async (domain: UserCustomDomainData) => {
    try {
      const response = await fetch(`/api/custom-domain/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: domain.id }),
      });

      const result = await response.json();
      if (result.status === "success") {
        toast.success("域名验证成功");
        mutate(action, undefined);
      } else {
        toast.error(result.message || "域名验证失败");
      }
    } catch (error) {
      toast.error("验证请求失败");
      console.error(error);
    }
  };

  // 删除自定义域名
  const deleteDomain = async (domain: UserCustomDomainData) => {
    if (!confirm(`确定要删除域名 ${domain.domainName} 吗？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/custom-domain/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: domain.id }),
      });

      const result = await response.json();
      if (result.status === "success") {
        toast.success("域名已成功删除");
        mutate(action, undefined);
      } else {
        toast.error(result.message || "删除域名失败");
      }
    } catch (error) {
      toast.error("删除请求失败");
      console.error(error);
    }
  };

  // 检查用户是否已达到域名限制
  const hasReachedLimit = () => {
    if (user.role === "ADMIN") return false;
    const limit = TeamPlanQuota[user.team].customDomains;
    const count = data?.data?.length || 0;
    return count >= limit;
  };

  return (
    <>
      <Card className="xl:col-span-2">
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle>自定义域名</CardTitle>
            <CardDescription className="hidden text-balance sm:block">
              将您自己的域名添加到系统中，用于DNS记录和短链接。
            </CardDescription>
          </div>
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
              className="w-[140px] shrink-0 gap-1"
              variant="default"
              onClick={() => {
                setCurrentEditDomain(null);
                setShowForm(!isShowForm);
              }}
              disabled={hasReachedLimit()}
            >
              添加自定义域名
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isShowForm && (
            <DomainForm
              user={{ id: user.id, name: user.name }}
              isShowForm={isShowForm}
              setShowForm={setShowForm}
              initData={currentEditDomain}
              action={action}
              onSuccess={() => {
                mutate(action, undefined);
              }}
            />
          )}

          {isLoading ? (
            <div className="mb-4 rounded-md border dark:border-slate-700">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow className="grid grid-cols-3 sm:grid-cols-5">
                    <TableHead className="col-span-1">域名</TableHead>
                    <TableHead className="col-span-1">验证方式</TableHead>
                    <TableHead className="col-span-1 hidden sm:table-cell">
                      创建时间
                    </TableHead>
                    <TableHead className="col-span-1 hidden text-center sm:table-cell">
                      状态
                    </TableHead>
                    <TableHead className="col-span-1 text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableColumnSkeleton key={i} />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : data?.data?.length ? (
            <div className="mb-4 rounded-md border dark:border-slate-700">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow className="grid grid-cols-3 sm:grid-cols-5">
                    <TableHead className="col-span-1">域名</TableHead>
                    <TableHead className="col-span-1">验证方式</TableHead>
                    <TableHead className="col-span-1 hidden sm:table-cell">
                      创建时间
                    </TableHead>
                    <TableHead className="col-span-1 hidden text-center sm:table-cell">
                      状态
                    </TableHead>
                    <TableHead className="col-span-1 text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(data?.data) && data.data
                    .filter(domain => domain && domain.id && domain.domainName && domain.createdAt)
                    .map((domain) => (
                      <TableRow
                        key={domain.id || Math.random()}
                        className="grid grid-cols-3 items-center sm:grid-cols-5"
                      >
                        <TableCell className="col-span-1 font-medium">
                          {domain.domainName || "未知域名"}
                        </TableCell>
                        <TableCell className="col-span-1">
                          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">
                            DNS验证
                          </Badge>
                        </TableCell>
                        <TableCell className="col-span-1 hidden sm:table-cell">
                          {domain.createdAt ? timeAgo(new Date(domain.createdAt)) : "未知时间"}
                        </TableCell>
                        <TableCell className="col-span-1 hidden text-center sm:table-cell">
                          {domain.isVerified ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <ShieldCheckIcon className="inline h-5 w-5 text-green-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>已验证</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <ShieldAlertIcon className="inline h-5 w-5 text-yellow-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>未验证</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                        <TableCell className="col-span-1 flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCurrentEditDomain(domain);
                              setShowForm(true);
                            }}
                          >
                            编辑
                          </Button>
                          {!domain.isVerified && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => verifyDomain(domain)}
                            >
                              验证
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteDomain(domain)}
                          >
                            删除
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyPlaceholder>
              <EmptyPlaceholder.Icon name="globeLock" />
              <EmptyPlaceholder.Title>没有自定义域名</EmptyPlaceholder.Title>
              <EmptyPlaceholder.Description>
                您还没有添加任何自定义域名。开始添加您的域名吧。
              </EmptyPlaceholder.Description>
              <Button
                onClick={() => {
                  setCurrentEditDomain(null);
                  setShowForm(true);
                }}
                disabled={hasReachedLimit()}
              >
                添加自定义域名
              </Button>
            </EmptyPlaceholder>
          )}

          {/* 用户计划信息 */}
          <div className="mt-4 rounded-md border p-4 dark:border-slate-700">
            <h3 className="mb-2 text-sm font-semibold">您的域名配额</h3>
            <p className="text-sm text-muted-foreground">
              {user.role === "ADMIN" ? (
                "作为管理员，您可以添加无限数量的自定义域名。"
              ) : (
                <>
                  您当前的计划 ({user.team}) 允许添加最多{" "}
                  <span className="font-semibold">
                    {TeamPlanQuota[user.team].customDomains}
                  </span>{" "}
                  个自定义域名。
                  {data?.data && (
                    <>
                      {" "}
                      已使用{" "}
                      <span className="font-semibold">{data.data.length}</span>/
                      {TeamPlanQuota[user.team].customDomains}。
                    </>
                  )}
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
} 