import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getUserRecordCount } from "@/lib/dto/cloudflare-dns-record";
import {
  getAllUserEmailsCount,
  getAllUserInboxEmailsCount,
} from "@/lib/dto/email";
import { getScrapeStatsByType } from "@/lib/dto/scrape";
import { getUserShortUrlCount } from "@/lib/dto/short-urls";
import { getAllUsersActiveApiKeyCount, getAllUsersCount } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { InteractiveBarChart } from "@/components/charts/interactive-bar-chart";
import {
  DashboardInfoCard,
  UserInfoCard,
} from "@/components/dashboard/dashboard-info-card";
import { DashboardHeader } from "@/components/dashboard/header";
import { ErrorBoundary } from "@/components/shared/error-boundary";

import { DailyPVUVChart } from "../dashboard/scrape/daily-chart";
import LogsTable from "../dashboard/scrape/logs";
import { RadialShapeChart } from "./api-key-active-chart";
import { LineChartMultiple } from "./line-chart-multiple";

export const metadata = constructMetadata({
  title: "管理员 – apil.top",
  description: "仅供管理员管理的管理页面。",
});

// 用户卡片组件
async function UserInfoCardSection({ userId }: { userId: string }) {
  const user_count = await getAllUsersCount();

  return (
    <UserInfoCard
      userId={userId}
      title="用户"
      count={user_count}
      link="/admin/users"
    />
  );
}

// 短链接卡片组件
async function ShortUrlsCardSection({ userId }: { userId: string }) {
  const url_count = await getUserShortUrlCount(userId, 1, "ADMIN");

  return (
    <DashboardInfoCard
      userId={userId}
      title="短链接"
      total={url_count.total}
      monthTotal={url_count.month_total}
      limit={1000000}
      link="/admin/urls"
      icon="link"
    />
  );
}

// DNS 记录卡片组件
async function DnsRecordsCardSection({ userId }: { userId: string }) {
  const record_count = await getUserRecordCount(userId, 1, "ADMIN");

  return (
    <DashboardInfoCard
      userId={userId}
      title="DNS记录"
      total={record_count.total}
      monthTotal={record_count.month_total}
      limit={1000000}
      link="/admin/records"
      icon="globeLock"
    />
  );
}

// 邮件卡片组件
async function EmailsCardSection({ userId }: { userId: string }) {
  const email_count = await getAllUserEmailsCount(userId, "ADMIN");

  return (
    <DashboardInfoCard
      userId={userId}
      title="邮件"
      total={email_count.total}
      monthTotal={email_count.month_total}
      limit={1000000}
      link="/admin"
      icon="mail"
    />
  );
}

// 收件箱卡片组件
async function InboxCardSection({ userId }: { userId: string }) {
  const inbox_count = await getAllUserInboxEmailsCount();

  return (
    <DashboardInfoCard
      userId={userId}
      title="收件箱"
      total={inbox_count.total}
      monthTotal={inbox_count.month_total}
      limit={1000000}
      link="/admin"
      icon="inbox"
    />
  );
}

// 交互式柱状图组件
async function InteractiveBarChartSection() {
  return <InteractiveBarChart />;
}

// 请求统计图表组件
async function RequestStatsSection() {
  const screenshot_stats = await getScrapeStatsByType("screenshot");
  const meta_stats = await getScrapeStatsByType("meta-info");
  const md_stats = await getScrapeStatsByType("markdown");
  const text_stats = await getScrapeStatsByType("text");
  const qr_stats = await getScrapeStatsByType("qrcode");

  const hasStats =
    screenshot_stats.length > 0 ||
    meta_stats.length > 0 ||
    md_stats.length > 0 ||
    text_stats.length > 0;

  return hasStats ? (
    <>
      <h2 className="my-1 text-xl font-semibold">请求统计</h2>
      <DailyPVUVChart
        data={screenshot_stats
          .concat(meta_stats)
          .concat(md_stats)
          .concat(text_stats)
          .concat(qr_stats)}
      />
    </>
  ) : null;
}

// 径向图组件
async function RadialShapeChartSection() {
  const user_count = await getAllUsersCount();
  const user_api_key_count = await getAllUsersActiveApiKeyCount();

  return <RadialShapeChart totalUser={user_count} total={user_api_key_count} />;
}

// 二维码/截图折线图组件
async function QrScreenshotChartSection() {
  const screenshot_stats = await getScrapeStatsByType("screenshot");
  const qr_stats = await getScrapeStatsByType("qrcode");

  return (
    <LineChartMultiple
      chartData={qr_stats.concat(screenshot_stats)}
      type1="qrcode"
      type2="screenshot"
    />
  );
}

// 截图/元信息折线图组件
async function ScreenshotMetaChartSection() {
  const screenshot_stats = await getScrapeStatsByType("screenshot");
  const meta_stats = await getScrapeStatsByType("meta-info");

  return (
    <LineChartMultiple
      chartData={screenshot_stats.concat(meta_stats)}
      type1="screenshot"
      type2="meta-info"
    />
  );
}

// Markdown/文本折线图组件
async function MarkdownTextChartSection() {
  const md_stats = await getScrapeStatsByType("markdown");
  const text_stats = await getScrapeStatsByType("text");

  return (
    <LineChartMultiple
      chartData={md_stats.concat(text_stats)}
      type1="markdown"
      type2="text"
    />
  );
}

// 日志表格组件
async function LogsSection({ userId }: { userId: string }) {
  return (
    <>
      <h2 className="my-1 text-xl font-semibold">请求日志</h2>
      <LogsTable userId={userId} target={"/api/v1/scraping/admin/logs"} />
    </>
  );
}

// 开发日志卡片组件
function DevLogsCardSection() {
  return (
    <div className="col-span-3 lg:col-span-1">
      <div className="flex h-full flex-col rounded-xl border bg-card p-5 text-card-foreground shadow">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">开发日志</h3>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <path d="M14 2v6h6"></path>
            <path d="M16 13H8"></path>
            <path d="M16 17H8"></path>
            <path d="M10 9H8"></path>
          </svg>
        </div>
        <div className="flex flex-1 flex-col justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">查看和管理系统日志，包括错误、警告和信息</p>
          </div>
          <div className="pt-4">
            <a
              className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              href="/admin/dev-logs"
            >
              查看日志
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// 主组件
export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || !user.id || user.role !== "ADMIN") redirect("/login");

  return (
    <>
      <DashboardHeader
        heading="管理员面板"
        text="仅对具有管理员角色的用户开放访问。"
      />
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-3">
          <ErrorBoundary
            fallback={<Skeleton className="h-32 w-full rounded-lg" />}
          >
            <Suspense
              fallback={<Skeleton className="h-32 w-full rounded-lg" />}
            >
              <UserInfoCardSection userId={user.id} />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary
            fallback={<Skeleton className="h-32 w-full rounded-lg" />}
          >
            <Suspense
              fallback={<Skeleton className="h-32 w-full rounded-lg" />}
            >
              <ShortUrlsCardSection userId={user.id} />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary
            fallback={<Skeleton className="h-32 w-full rounded-lg" />}
          >
            <Suspense
              fallback={<Skeleton className="h-32 w-full rounded-lg" />}
            >
              <DnsRecordsCardSection userId={user.id} />
            </Suspense>
          </ErrorBoundary>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ErrorBoundary
            fallback={<Skeleton className="h-32 w-full rounded-lg" />}
          >
            <Suspense
              fallback={<Skeleton className="h-32 w-full rounded-lg" />}
            >
              <EmailsCardSection userId={user.id} />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary
            fallback={<Skeleton className="h-32 w-full rounded-lg" />}
          >
            <Suspense
              fallback={<Skeleton className="h-32 w-full rounded-lg" />}
            >
              <InboxCardSection userId={user.id} />
            </Suspense>
          </ErrorBoundary>
        </div>
        <ErrorBoundary
          fallback={<Skeleton className="h-[380px] w-full rounded-lg" />}
        >
          <Suspense
            fallback={<Skeleton className="h-[380px] w-full rounded-lg" />}
          >
            <InteractiveBarChartSection />
          </Suspense>
        </ErrorBoundary>
        <ErrorBoundary
          fallback={<Skeleton className="min-h-[342px] w-full rounded-lg" />}
        >
          <Suspense
            fallback={<Skeleton className="min-h-[342px] w-full rounded-lg" />}
          >
            <RequestStatsSection />
          </Suspense>
        </ErrorBoundary>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ErrorBoundary
            fallback={<Skeleton className="h-[320px] w-full rounded-lg" />}
          >
            <Suspense
              fallback={<Skeleton className="h-[320px] w-full rounded-lg" />}
            >
              <RadialShapeChartSection />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary
            fallback={<Skeleton className="h-[320px] w-full rounded-lg" />}
          >
            <Suspense
              fallback={<Skeleton className="h-[320px] w-full rounded-lg" />}
            >
              <QrScreenshotChartSection />
            </Suspense>
          </ErrorBoundary>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ErrorBoundary
            fallback={<Skeleton className="h-[320px] w-full rounded-lg" />}
          >
            <Suspense
              fallback={<Skeleton className="h-[320px] w-full rounded-lg" />}
            >
              <ScreenshotMetaChartSection />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary
            fallback={<Skeleton className="h-[320px] w-full rounded-lg" />}
          >
            <Suspense
              fallback={<Skeleton className="h-[320px] w-full rounded-lg" />}
            >
              <MarkdownTextChartSection />
            </Suspense>
          </ErrorBoundary>
        </div>
        <ErrorBoundary
          fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}
        >
          <Suspense
            fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}
          >
            <LogsSection userId={user.id} />
          </Suspense>
        </ErrorBoundary>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <DevLogsCardSection />
        </div>
      </div>
    </>
  );
}
