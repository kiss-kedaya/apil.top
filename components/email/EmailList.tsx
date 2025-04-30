"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ForwardEmail } from "@prisma/client";
import { toast } from "sonner";
import useSWR from "swr";

import { cn, fetcher, htmlToText, timeAgo } from "@/lib/utils";

import BlurImage from "../shared/blur-image";
import { Icons } from "../shared/icons";
import { PaginationWrapper } from "../shared/pagination";
// import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Skeleton } from "../ui/skeleton";
import { Switch } from "../ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import EmailDetail from "./EmailDetail";
import Loader from "./Loader";
import { SendEmailModal } from "./SendEmailModal";

interface EmailListProps {
  emailAddress: string | null;
  selectedEmailId: string | null;
  onSelectEmail: (emailId: string | null) => void;
  className?: string;
  isAdminModel: boolean;
}

export default function EmailList({
  emailAddress,
  selectedEmailId,
  onSelectEmail,
  className,
  isAdminModel,
}: EmailListProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [showMutiCheckBox, setShowMutiCheckBox] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<{
    total: number;
    list: ForwardEmail[];
  }>(
    emailAddress
      ? `/api/email/inbox?emailAddress=${emailAddress}&page=${currentPage}&size=${pageSize}`
      : null,
    fetcher,
    {
      refreshInterval: isAutoRefresh ? 5000 : 0,
      dedupingInterval: 2000,
    },
  );

  useEffect(() => {
    if (emailAddress && selectedEmailId) {
      const emailExists = data?.list.some(
        (email) => email.id === selectedEmailId,
      );
      if (!emailExists) {
        onSelectEmail(null);
      }
    }
  }, [emailAddress, data, selectedEmailId]);

  const handleMarkAsRead = async (emailId: string) => {
    try {
      await fetch("/api/email/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId }),
      }).then(() => mutate());
    } catch (error) {
      console.log("标记邮件为已读时出错");
    }
  };

  const handleMarkSelectedAsRead = async () => {
    if (selectedEmails.length === 0) {
      toast.error("请至少选择一封邮件");
      return;
    }

    try {
      const response = await fetch("/api/email/read", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailIds: selectedEmails }),
      });

      if (response.ok) {
        setSelectedEmails([]);
        mutate();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "标记邮件为已读失败");
      }
    } catch (error) {
      toast.error("标记邮件为已读时出错");
    }
  };

  const handleSelectEmail = (emailId: string) => {
    setSelectedEmails((prev) =>
      prev.includes(emailId)
        ? prev.filter((id) => id !== emailId)
        : [...prev, emailId],
    );
  };

  const handleSetAutoRefresh = (value: boolean) => {
    setIsAutoRefresh(value);
  };

  const handleManualRefresh = async () => {
    if (!isAutoRefresh) {
      setIsRefreshing(true);
      await mutate();
      setIsRefreshing(false);
    }
  };

  const handleEmailSelection = (emailId: string | null) => {
    if (emailId) {
      const selectedEmail = data?.list?.find((email) => email.id === emailId);
      if (selectedEmail && !selectedEmail.readAt) {
        handleMarkAsRead(emailId);
      }
    }
    onSelectEmail(emailId);
  };

  if (!emailAddress) {
    return EmptyInboxSection();
  }

  return (
    <div className={cn("grids flex flex-1 flex-col", className)}>
      <div className="flex items-center gap-2 bg-neutral-200/40 p-2 text-base font-semibold text-neutral-600 backdrop-blur dark:bg-neutral-800 dark:text-neutral-50">
        <Icons.inbox size={20} />
        <span>收件箱</span>
        <div className="ml-auto flex items-center justify-center gap-2">
          <SendEmailModal emailAddress={emailAddress} onSuccess={mutate} />
          <TooltipProvider>
            <Tooltip delayDuration={200}>
              <TooltipTrigger>
                <Switch
                  className="mt-1 data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-neutral-300 dark:data-[state=unchecked]:bg-neutral-200"
                  onCheckedChange={handleSetAutoRefresh}
                  defaultChecked={isAutoRefresh}
                  aria-label="自动刷新"
                />
              </TooltipTrigger>
              <TooltipContent side="bottom">自动刷新</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoading || isAutoRefresh}
          >
            <Icons.refreshCw
              size={15}
              className={cn(
                isRefreshing || isLoading || isAutoRefresh
                  ? "animate-spin"
                  : "",
              )}
            />
          </Button>
          <Button
            className={cn(
              showMutiCheckBox ? "bg-primary text-primary-foreground" : "",
            )}
            variant="outline"
            size="sm"
            onClick={() => setShowMutiCheckBox(!showMutiCheckBox)}
          >
            <Icons.listChecks className="size-4" />
          </Button>
          {selectedEmails.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex w-full items-center gap-1"
                >
                  <span className="text-sm">更多</span>
                  <Icons.chevronDown className="mt-0.5 size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkSelectedAsRead}
                    className="w-full"
                  >
                    <span className="text-xs">标记为已读</span>
                  </Button>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Button variant="ghost" size="sm" className="w-full">
                    <span className="text-xs">删除所选</span>
                  </Button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      {isLoading && (
        <div className="flex flex-col gap-2 p-1">
          {[...Array(9)].map((_, index) => (
            <Skeleton key={index} className="h-[80px] w-full rounded-lg" />
          ))}
        </div>
      )}
      {!isLoading && !error && (
        <div className="scrollbar-hidden relative h-[calc(100vh-105px)] animate-fade-in overflow-scroll">
          {selectedEmailId ? (
            <EmailDetail
              email={data?.list?.find((email) => email.id === selectedEmailId)}
              selectedEmailId={selectedEmailId}
              onClose={() => onSelectEmail(null)}
              onMarkAsRead={() => handleMarkAsRead(selectedEmailId)}
            />
          ) : (
            <>
              {!data || data.list.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center">
                  <Icons.mailPlus size={50} className="text-neutral-300" />
                  <h3 className="mt-2 text-xl text-neutral-400">
                    没有邮件
                  </h3>
                  <p className="text-sm text-neutral-400">
                    您的收件箱中暂无邮件
                  </p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {data.list.map((email) => (
                    <div
                      key={email.id}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-2 rounded-md border p-2 hover:bg-neutral-100/80 dark:hover:bg-neutral-800",
                        email.id === selectedEmailId
                          ? "border-primary bg-primary/10"
                          : "border-transparent",
                        !email.readAt && "bg-blue-50 dark:bg-blue-950/20",
                      )}
                      onClick={() => {
                        if (showMutiCheckBox) {
                          handleSelectEmail(email.id);
                        } else {
                          handleEmailSelection(email.id);
                        }
                      }}
                    >
                      {showMutiCheckBox && (
                        <div
                          className="ml-0.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectEmail(email.id);
                          }}
                        >
                          <Checkbox
                            className="h-3.5 w-3.5 dark:text-neutral-500"
                            checked={selectedEmails.includes(email.id)}
                            onCheckedChange={() => handleSelectEmail(email.id)}
                          />
                        </div>
                      )}
                      <div
                        className={cn(
                          "h-10 w-10 shrink-0 overflow-hidden rounded-full",
                          showMutiCheckBox && "hidden sm:block",
                        )}
                      >
                        <BlurImage
                          className="h-10 w-10 border bg-neutral-200 object-cover"
                          width={40}
                          height={40}
                          src={getRandomImageUrl(email.from)}
                          alt={email.from || "发件人"}
                        />
                      </div>
                      <div className="flex-1 truncate">
                        <p
                          className={cn(
                            "text-md line-clamp-1 truncate font-semibold text-neutral-900 dark:text-neutral-50",
                            email.readAt && "text-neutral-700",
                          )}
                        >
                          {email.from}
                        </p>

                        <div className="flex items-center gap-2">
                          <p
                            className={cn(
                              "line-clamp-1 text-sm text-neutral-600 dark:text-neutral-400",
                            )}
                          >
                            {email.subject || "无主题"}
                          </p>
                          {!email.readAt && (
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                          )}
                        </div>
                        <p className="line-clamp-1 text-xs text-neutral-500 dark:text-neutral-400">
                          {htmlToText(email.text || "")}
                        </p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="truncate text-xs text-neutral-400">
                          {timeAgo(new Date(email.createdAt))}
                        </p>
                      </div>
                    </div>
                  ))}
                  {data.total > pageSize && (
                    <PaginationWrapper
                      total={Math.ceil(data.total / pageSize)}
                      currentPage={currentPage}
                      setCurrentPage={setCurrentPage}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const getRandomImageUrl = (email: string | null) => {
  if (!email) return "";
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${email}`;
};

export function EmptyInboxSection() {
  return (
    <div className="flex h-full flex-col items-center justify-center space-y-3">
      <Icons.inbox className="size-12 text-neutral-300" />
      <div className="space-y-0.5 text-center">
        <h1 className="text-lg font-semibold">无可用的邮箱</h1>
        <p className="text-sm text-muted-foreground">请先从左侧选择一个邮箱</p>
      </div>
      <div className="py-2">
        <Button variant="outline" size="sm">
          <Link href="/dashboard/email/add" className="flex items-center">
            <Icons.add className="size-3.5" />
            <span className="ml-1 text-xs">创建邮箱</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
