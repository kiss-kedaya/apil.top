"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { User, UserEmail } from "@prisma/client";
import randomName from "@scaleway/random-name";
import {
  PanelLeftClose,
  PanelRightClose,
  PenLine,
  Search,
  Sparkles,
  SquarePlus,
} from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";

import { siteConfig } from "@/config/site";
import { TeamPlanQuota } from "@/config/team";
import { UserEmailList } from "@/lib/dto/email";
import { reservedAddressSuffix } from "@/lib/enums";
import { cn, fetcher, timeAgo } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import DomainSelector from "@/components/shared/DomainSelector";
import ApiReference from "@/app/emails/api-reference";

import CountUp from "../dashboard/count-up";
import { CopyButton } from "../shared/copy-button";
import { EmptyPlaceholder } from "../shared/empty-placeholder";
import { Icons } from "../shared/icons";
import { PaginationWrapper } from "../shared/pagination";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Modal } from "../ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Skeleton } from "../ui/skeleton";
import { Switch } from "../ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { SendEmailModal } from "./SendEmailModal";
import SendsEmailList from "./SendsEmailList";

interface EmailSidebarProps {
  user: User;
  onSelectEmail: (emailAddress: string | null) => void;
  selectedEmailAddress: string | null;
  className?: string;
  isCollapsed?: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
  isAdminModel: boolean;
  setAdminModel: (isAdminModel: boolean) => void;
}

export default function EmailSidebar({
  user,
  onSelectEmail,
  selectedEmailAddress,
  className,
  isCollapsed,
  setIsCollapsed,
  isAdminModel,
  setAdminModel,
}: EmailSidebarProps) {
  const { isMobile } = useMediaQuery();
  const pathname = usePathname();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [domainSuffix, setDomainSuffix] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState<string | null>(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [showSendsModal, setShowSendsModal] = useState(false);
  const [userEmails, setUserEmails] = useState<UserEmailList[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [availableDomains, setAvailableDomains] = useState<string[]>(
    siteConfig.emailDomains,
  );
  const [isLoadingDomains, setIsLoadingDomains] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [emailListPages, setEmailListPages] = useState(1);

  const pageSize = 10;

  const { data, isLoading, error, mutate } = useSWR<{
    list: UserEmailList[];
    total: number;
    totalInboxCount: number;
    totalUnreadCount: number;
    availableDomains: string[];
  }>(
    `/api/email?page=${currentPage}&size=${pageSize}&search=${searchQuery}&all=${isAdminModel}&unread=${onlyUnread}`,
    fetcher,
    { dedupingInterval: 5000 },
  );

  const { data: sendEmails } = useSWR<number>(
    `/api/email/send?all=${isAdminModel}`,
    fetcher,
    {
      dedupingInterval: 5000,
    },
  );

  const fetchEmails = useCallback(
    async (page = 1) => {
      try {
        const size = 50;
        const response = await fetch(
          `/api/email?page=${page}&size=${size}${isAdminModel ? "&all=true" : ""}`,
        );
        if (response.ok) {
          const result = await response.json();
          if (result.list && Array.isArray(result.list)) {
            setUserEmails(result.list);

            // 设置总页数
            if (result.total) {
              setEmailListPages(Math.ceil(result.total / size));
              setTotalPages(Math.ceil(result.total / pageSize));
            }
          }
        }
      } catch (error) {
        console.error("获取邮箱列表出错:", error);
      }
    },
    [isAdminModel, pageSize],
  );

  useEffect(() => {
    fetchEmails();

    // 设置默认域名
    if (!domainSuffix && siteConfig.emailDomains.length > 0) {
      setDomainSuffix(siteConfig.emailDomains[0]);
    }
  }, [fetchEmails, domainSuffix]);

  useEffect(() => {
    // 从API响应中更新数据
    if (data) {
      if (data.list && Array.isArray(data.list)) {
        setUserEmails(data.list);
      }

      if (data.total) {
        setTotalPages(Math.ceil(data.total / pageSize));
      }

      // 如果没有选择邮箱且有数据，选择第一个
      if (!selectedEmailAddress && data.list && data.list.length > 0) {
        onSelectEmail(data.list[0].emailAddress);
      }
    }
  }, [data, selectedEmailAddress, onSelectEmail, pageSize]);

  const handleSubmitEmail = async (emailSuffix: string) => {
    if (!emailSuffix || emailSuffix.length < 5) {
      toast.error("邮箱地址字符至少需要5个");
      return;
    }
    if (/[^a-zA-Z0-9_\-\.]/.test(emailSuffix)) {
      toast.error("邮箱地址格式无效");
      return;
    }
    if (!domainSuffix) {
      toast.error("域名后缀不能为空");
      return;
    }
    if (reservedAddressSuffix.includes(emailSuffix)) {
      toast.error("此邮箱地址已被保留，请选择其他地址");
      return;
    }

    startTransition(async () => {
      if (isEdit) {
        const editEmailId = userEmails.find(
          (email) => email.emailAddress === selectedEmailAddress,
        )?.id;
        const res = await fetch(`/api/email/${editEmailId}`, {
          method: "PUT",
          body: JSON.stringify({
            emailAddress: `${emailSuffix}@${domainSuffix}`,
          }),
        });
        if (res.ok) {
          mutate();
          fetchEmails();
          setShowEmailModal(false);
          toast.success("邮箱更新成功");
        } else {
          toast.error("更新邮箱失败", {
            description: await res.text(),
          });
        }
        return;
      } else {
        try {
          const res = await fetch("/api/email", {
            method: "POST",
            body: JSON.stringify({
              emailAddress: `${emailSuffix}@${domainSuffix}`,
            }),
          });
          if (res.ok) {
            mutate();
            fetchEmails();
            setShowEmailModal(false);
            toast.success("邮箱创建成功");
          } else {
            toast.error("创建邮箱失败", {
              description: await res.text(),
            });
          }
        } catch (error) {
          console.log("创建邮箱时出错:", error);
          toast.error("创建邮箱失败");
        }
      }
    });
  };

  const handleOpenEditEmail = async (email: UserEmailList) => {
    onSelectEmail(email.emailAddress);
    setDomainSuffix(email.emailAddress.split("@")[1]);
    if (selectedEmailAddress === email.emailAddress) {
      setIsEdit(true);
      setShowEmailModal(true);
    }
  };

  const handleDeleteEmail = async (id: string) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/email/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          mutate();
          fetchEmails();
          setShowDeleteModal(false);
          setDeleteInput("");
          setEmailToDelete(null);
          toast.success("邮箱删除成功");
        } else {
          toast.error("删除邮箱失败");
        }
      } catch (error) {
        console.log("删除邮箱时出错:", error);
      }
    });
  };

  const confirmDelete = () => {
    if (!emailToDelete) return;

    if (deleteInput === emailToDelete) {
      const emailId = userEmails.find(
        (email) => email.emailAddress === emailToDelete,
      )?.id;
      if (emailId) {
        handleDeleteEmail(emailId);
      }
    } else {
      toast.error("输入不匹配，请正确输入完整邮箱地址");
    }
  };

  return (
    <div
      className={cn(`flex h-full flex-col border-r transition-all`, className)}
    >
      {/* Header */}
      <div className="border-b p-2 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          {!isCollapsed && (
            <div className="flex w-full items-center gap-2">
              <Button
                className="size-8 lg:size-7"
                variant="outline"
                size="icon"
                onClick={async () => {
                  setIsRefreshing(true);
                  await mutate();
                  await fetchEmails();
                  setIsRefreshing(false);
                }}
                disabled={isRefreshing}
              >
                <Icons.refreshCw
                  size={15}
                  className={
                    isRefreshing || isLoading
                      ? "animate-spin stroke-muted-foreground"
                      : "stroke-muted-foreground"
                  }
                />
              </Button>
              <div className="relative w-full grow">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索邮件..."
                  className="h-[30px] w-full border p-1 pl-8 text-xs placeholder:text-xs"
                />
                <Search className="absolute left-2 top-2 size-4 text-gray-500" />
              </div>
            </div>
          )}
          <Button
            className={cn("px-1", !isCollapsed ? "size-7" : "size-8")}
            variant="outline"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <PanelRightClose size={16} className="stroke-muted-foreground" />
            ) : (
              <PanelLeftClose size={16} className="stroke-muted-foreground" />
            )}
          </Button>
        </div>

        <Button
          className={
            isCollapsed
              ? "mx-auto size-9 lg:size-8"
              : "flex h-8 w-full items-center justify-center gap-2"
          }
          variant="default"
          size="icon"
          onClick={() => {
            setIsEdit(false);
            setShowEmailModal(true);
          }}
        >
          <SquarePlus className="size-4" />
          {!isCollapsed && <span className="text-xs">创建新邮箱</span>}
        </Button>

        {!isCollapsed && (
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg text-xs text-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
            {/* Address */}
            <div className="flex flex-col items-center gap-1 rounded-md bg-neutral-100 px-1 pb-1 pt-2 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-gray-700">
              <div className="flex items-center gap-1">
                <Icons.mail className="size-3" />
                <p className="line-clamp-1 text-start font-medium">邮箱地址</p>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                <CountUp count={data ? data.total : 0} />
              </p>
            </div>

            {/* Inbox Emails */}
            <div className="flex flex-col items-center gap-1 rounded-md bg-neutral-100 px-1 pb-1 pt-2 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-gray-700">
              <div className="flex items-center gap-1">
                <Icons.inbox className="size-3" />
                <p className="line-clamp-1 text-start font-medium">
                  收件箱邮件
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                <CountUp count={data ? data.totalInboxCount : 0} />
              </p>
            </div>

            <div
              className={cn(
                "relative flex cursor-pointer flex-col items-center gap-1 rounded-md bg-neutral-100 px-1 pb-1 pt-2 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-gray-700",
                {
                  "bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-gray-700":
                    onlyUnread,
                },
              )}
              onClick={() => {
                setOnlyUnread(!onlyUnread);
              }}
            >
              <div className="flex items-center gap-1">
                <Icons.mailOpen className="size-3" />
                <p className="line-clamp-1 text-start font-medium">未读邮件</p>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                <CountUp count={data ? data.totalUnreadCount : 0} />
              </p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Icons.listFilter className="absolute bottom-1 right-1 size-3" />
                  </TooltipTrigger>
                  <TooltipContent>筛选未读邮件</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Sent Emails */}
            <div
              onClick={() => setShowSendsModal(!showSendsModal)}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1 rounded-md bg-neutral-100 px-1 pb-1 pt-2 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-gray-700",
                {
                  "bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-gray-700":
                    showSendsModal,
                },
              )}
            >
              <div className="flex items-center gap-1">
                <Icons.send className="size-3" />
                <p className="line-clamp-1 text-start font-medium">
                  已发送邮件
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                <CountUp count={sendEmails || 0} />
              </p>
            </div>
          </div>
        )}

        {!isCollapsed && user.role === "ADMIN" && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            管理员模式:{" "}
            <Switch
              defaultChecked={isAdminModel}
              onCheckedChange={(v) => setAdminModel(v)}
            />
          </div>
        )}
      </div>

      <div className="scrollbar-hidden flex-1 overflow-y-scroll">
        {isLoading && (
          <div className="flex flex-col gap-1 px-1 pt-1">
            <Skeleton className="h-[60px] w-full rounded-lg" />
            <Skeleton className="h-[60px] w-full rounded-lg" />
            <Skeleton className="h-[60px] w-full rounded-lg" />
            <Skeleton className="h-[60px] w-full rounded-lg" />
            <Skeleton className="h-[60px] w-full rounded-lg" />
            <Skeleton className="h-[60px] w-full rounded-lg" />
            <Skeleton className="h-[60px] w-full rounded-lg" />
            <Skeleton className="h-[60px] w-full rounded-lg" />
            <Skeleton className="h-[60px] w-full rounded-lg" />
          </div>
        )}
        {error && (
          <div className="flex flex-col gap-1 p-1">
            <Skeleton className="h-[50px] w-full rounded-lg" />
            <Skeleton className="h-[50px] w-full rounded-lg" />
            <Skeleton className="h-[50px] w-full rounded-lg" />
          </div>
        )}
        {!error && !isLoading && userEmails && userEmails.length === 0 && (
          <>
            {!isCollapsed ? (
              <div className="flex h-full items-center justify-center">
                <EmptyPlaceholder>
                  <EmptyPlaceholder.Icon name="mailPlus" />
                  <EmptyPlaceholder.Title>无可用的邮箱</EmptyPlaceholder.Title>
                  <EmptyPlaceholder.Description>
                    请先创建一个邮箱地址，以便接收和发送邮件。
                  </EmptyPlaceholder.Description>
                  <Button 
                    variant="default" 
                    onClick={() => {
                      setIsEdit(false);
                      setShowEmailModal(true);
                    }}
                    className="mt-2 flex items-center gap-2"
                  >
                    <SquarePlus className="size-4" />
                    <span>创建新邮箱</span>
                  </Button>
                </EmptyPlaceholder>
              </div>
            ) : (
              <div className="flex flex-col gap-1 px-1 pt-1">
                <Skeleton className="h-[55px] w-full rounded-lg" />
                <Skeleton className="h-[55px] w-full rounded-lg" />
                <Skeleton className="h-[55px] w-full rounded-lg" />
                <Skeleton className="h-[55px] w-full rounded-lg" />
                <Skeleton className="h-[55px] w-full rounded-lg" />
                <Skeleton className="h-[55px] w-full rounded-lg" />
                <Skeleton className="h-[55px] w-full rounded-lg" />
                <Skeleton className="h-[55px] w-full rounded-lg" />
                <Skeleton className="h-[55px] w-full rounded-lg" />
              </div>
            )}
          </>
        )}

        {userEmails.map((email) => (
          <div
            key={email.id}
            onClick={() => onSelectEmail(email.emailAddress)}
            className={cn(
              `border-gray-5 group m-1 cursor-pointer bg-neutral-50 p-2 transition-colors hover:bg-neutral-100 dark:border-zinc-700 dark:bg-neutral-800 dark:hover:bg-neutral-900`,
              selectedEmailAddress === email.emailAddress
                ? "bg-gray-100 dark:bg-neutral-900"
                : "",
              isCollapsed ? "flex items-center justify-center" : "",
            )}
          >
            <div
              className={cn(
                "flex items-center justify-between gap-1 text-sm font-bold text-neutral-500 dark:text-zinc-400",
                isCollapsed
                  ? "size-10 justify-center rounded-xl bg-neutral-400 text-center text-white dark:text-neutral-100"
                  : "",
                selectedEmailAddress === email.emailAddress && isCollapsed
                  ? "bg-neutral-600"
                  : "",
              )}
            >
              <span className="w-2/3 truncate" title={email.emailAddress}>
                {isCollapsed
                  ? email.emailAddress.slice(0, 1).toLocaleUpperCase()
                  : email.emailAddress}
              </span>
              {!isCollapsed && (
                <>
                  <SendEmailModal
                    emailAddress={selectedEmailAddress}
                    onSuccess={mutate}
                    triggerButton={
                      <Icons.send
                        className={cn(
                          "size-5 rounded border p-1 text-primary",
                          !isMobile
                            ? "hidden hover:bg-neutral-200 group-hover:ml-auto group-hover:inline"
                            : "",
                        )}
                      />
                    }
                  />
                  <PenLine
                    className={cn(
                      "size-5 rounded border p-1 text-primary",
                      !isMobile
                        ? "hidden hover:bg-neutral-200 group-hover:inline"
                        : "",
                    )}
                    onClick={() => handleOpenEditEmail(email)}
                  />
                  <Icons.trash
                    className={cn(
                      "size-5 rounded border p-1 text-primary",
                      !isMobile
                        ? "hidden hover:bg-neutral-200 group-hover:inline"
                        : "",
                      email.deletedAt ? "bg-gray-400" : "",
                    )}
                    onClick={() => {
                      if (!email.deletedAt) {
                        setEmailToDelete(email.emailAddress);
                        setShowDeleteModal(true);
                      }
                    }}
                  />
                  <CopyButton
                    value={`${email.emailAddress}`}
                    className={cn(
                      "size-5 rounded border p-1",
                      "duration-250 transition-all hover:bg-neutral-200",
                    )}
                    title="Copy email address"
                  />
                </>
              )}
            </div>
            {!isCollapsed && (
              <div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  {email.unreadCount > 0 && (
                    <Badge variant="default">{email.unreadCount}</Badge>
                  )}
                  {email.count || 0} recived
                </div>
                <span>
                  {isAdminModel && email.user && email.email
                    ? `Created by ${email.user || (email.email && email.email.slice(0, 5))} at`
                    : ""}{" "}
                  {timeAgo(email.createdAt)}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {!isCollapsed && data && totalPages > 1 && (
        <PaginationWrapper
          className="m-0 scale-75 justify-center"
          total={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      )}

      {showSendsModal && (
        <Modal
          className="md:max-w-2xl"
          showModal={showSendsModal}
          setShowModal={setShowSendsModal}
        >
          <SendsEmailList isAdminModel={isAdminModel} />
        </Modal>
      )}

      {/* 邮箱创建/编辑模态框 */}
      <Modal
        showModal={showEmailModal}
        setShowModal={setShowEmailModal}
        onClose={() => {
          setIsEdit(false);
        }}
      >
        <div className="rounded-none border-0 p-0 sm:rounded-lg sm:border sm:p-6">
          <div className="flex flex-col gap-6">
            <div className="rounded-lg border-0 p-0">
              <div className="p-0">
                <h3 className="text-center text-lg font-medium">
                  {isEdit ? "编辑邮箱地址" : "创建新邮箱地址"}
                </h3>
                <div className="mt-4 flex flex-col space-y-4">
                  <div className="relative mt-4 flex items-center rounded-md border focus-within:ring-1 focus-within:ring-ring">
                    <Input
                      placeholder={
                        isEdit
                          ? selectedEmailAddress?.split("@")[0]
                          : randomName("", ".")
                      }
                      className="flex-1 border-0 focus-visible:ring-0"
                      id="email-input"
                      autoComplete="off"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const input = document.getElementById(
                            "email-input",
                          ) as HTMLInputElement;
                          if (input) {
                            handleSubmitEmail(input.value);
                          }
                        }
                      }}
                    />

                    <div className="flex items-center">
                      <span className="pointer-events-none text-sm text-muted-foreground">
                        @
                      </span>
                      <DomainSelector
                        type="email"
                        value={domainSuffix || undefined}
                        onChange={(value) => setDomainSuffix(value)}
                        disabled={isEdit}
                        triggerClassName="min-w-[120px] border-0 focus:ring-0"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>提示：</p>
                    <ul className="list-disc space-y-1 pl-4">
                      <li>邮箱用户名长度至少5个字符</li>
                      <li>只能包含字母、数字、下划线、连字符和点</li>
                      {isLoadingDomains ? (
                        <li>加载可用域名中...</li>
                      ) : availableDomains.length > 1 ? (
                        <li>可以使用系统域名或已验证的自定义域名</li>
                      ) : (
                        <li>您可以在"自定义域名"页面添加并验证自己的域名</li>
                      )}
                    </ul>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowEmailModal(false);
                        setIsEdit(false);
                      }}
                    >
                      取消
                    </Button>
                    <Button
                      disabled={isPending || !domainSuffix}
                      onClick={() => {
                        const input = document.getElementById(
                          "email-input",
                        ) as HTMLInputElement;
                        if (input) {
                          handleSubmitEmail(input.value);
                        }
                      }}
                    >
                      {isPending ? (
                        <Icons.spinner className="size-4 animate-spin" />
                      ) : (
                        <p>{isEdit ? "更新" : "创建"}</p>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* 删除邮箱的模态框 */}
      <Modal showModal={showDeleteModal} setShowModal={setShowDeleteModal}>
        <div className="p-6">
          <h2 className="mb-4 text-center text-lg font-semibold">
            确认删除邮箱
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            此操作不可撤销，删除后将无法恢复此邮箱及其所有邮件。
          </p>
          <div className="mb-4">
            <label
              htmlFor="deleteConfirm"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              请输入邮箱地址{" "}
              <span className="font-semibold text-red-500">
                {emailToDelete}
              </span>{" "}
              确认删除
            </label>
            <Input
              id="deleteConfirm"
              name="deleteConfirm"
              type="text"
              className="w-full"
              placeholder="请输入完整邮箱地址确认"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteInput("");
                setEmailToDelete(null);
              }}
            >
              取消
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteInput !== emailToDelete || isPending}
              onClick={confirmDelete}
            >
              {isPending ? (
                <Icons.spinner className="size-4 animate-spin" />
              ) : (
                <p>删除</p>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
