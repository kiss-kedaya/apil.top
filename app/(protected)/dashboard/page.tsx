import { Suspense } from "react";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { TeamPlanQuota } from "@/config/team";
import { getUserRecordCount } from "@/lib/dto/cloudflare-dns-record";
import { getAllUserEmailsCount } from "@/lib/dto/email";
import { getUserShortUrlCount } from "@/lib/dto/short-urls";
import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DashboardInfoCard,
  HeroCard,
} from "@/components/dashboard/dashboard-info-card";
import { DashboardHeader } from "@/components/dashboard/header";
import { ErrorBoundary } from "@/components/shared/error-boundary";

import UserRecordsList from "./records/record-list";
import LiveLog from "./urls/live-logs";
import UserUrlsList from "./urls/url-list";

export const metadata = constructMetadata({
  title: "仪表板 - kedaya.xyz",
  description: "列出并管理记录。",
});

async function EmailHeroCardSection({
  userId,
  team,
}: {
  userId: string;
  team: string;
}) {
  const email_count = await getAllUserEmailsCount(userId);

  return (
    <HeroCard
      total={email_count.total}
      monthTotal={email_count.month_total}
      limit={TeamPlanQuota[team].EM_EmailAddresses}
    />
  );
}

async function ShortUrlsCardSection({
  userId,
  team,
}: {
  userId: string;
  team: string;
}) {
  const url_count = await getUserShortUrlCount(userId);

  return (
    <DashboardInfoCard
      userId={userId}
      title="短链接"
      total={url_count.total}
      monthTotal={url_count.month_total}
      limit={TeamPlanQuota[team].SL_NewLinks}
      link="/dashboard/urls"
      icon="link"
    />
  );
}

async function DnsRecordsCardSection({
  userId,
  team,
}: {
  userId: string;
  team: string;
}) {
  const record_count = await getUserRecordCount(userId);

  return (
    <DashboardInfoCard
      userId={userId}
      title="DNS记录"
      total={record_count.total}
      monthTotal={record_count.month_total}
      limit={TeamPlanQuota[team].RC_NewRecords}
      link="/dashboard/records"
      icon="globeLock"
    />
  );
}

async function LiveLogSection() {
  return <LiveLog admin={false} />;
}

async function UserUrlsListSection({
  user,
}: {
  user: { id: string; name: string; apiKey: string; role: UserRole };
}) {
  return (
    <UserUrlsList
      user={{
        id: user.id,
        name: user.name,
        apiKey: user.apiKey,
        role: user.role,
      }}
      action="/api/url"
    />
  );
}

async function UserRecordsListSection({
  user,
}: {
  user: { id: string; name: string; apiKey: string };
}) {
  return (
    <UserRecordsList
      user={{
        id: user.id,
        name: user.name,
        apiKey: user.apiKey,
      }}
      action="/api/record"
    />
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user?.id) redirect("/login");

  return (
    <>
      <DashboardHeader heading="仪表板" text="" />
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-3">
          <ErrorBoundary
            fallback={<Skeleton className="h-32 w-full rounded-lg" />}
          >
            <Suspense
              fallback={<Skeleton className="h-32 w-full rounded-lg" />}
            >
              <EmailHeroCardSection userId={user.id} team={user.team} />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary
            fallback={<Skeleton className="h-32 w-full rounded-lg" />}
          >
            <Suspense
              fallback={<Skeleton className="h-32 w-full rounded-lg" />}
            >
              <ShortUrlsCardSection userId={user.id} team={user.team} />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary
            fallback={<Skeleton className="h-32 w-full rounded-lg" />}
          >
            <Suspense
              fallback={<Skeleton className="h-32 w-full rounded-lg" />}
            >
              <DnsRecordsCardSection userId={user.id} team={user.team} />
            </Suspense>
          </ErrorBoundary>
        </div>
        <ErrorBoundary
          fallback={<Skeleton className="h-[200px] w-full rounded-lg" />}
        >
          <Suspense
            fallback={<Skeleton className="h-[200px] w-full rounded-lg" />}
          >
            <LiveLogSection />
          </Suspense>
        </ErrorBoundary>
        <ErrorBoundary
          fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}
        >
          <Suspense
            fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}
          >
            <UserUrlsListSection
              user={{
                id: user.id,
                name: user.name || "",
                apiKey: user.apiKey || "",
                role: user.role,
              }}
            />
          </Suspense>
        </ErrorBoundary>
        <ErrorBoundary
          fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}
        >
          <Suspense
            fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}
          >
            <UserRecordsListSection
              user={{
                id: user.id,
                name: user.name || "",
                apiKey: user.apiKey || "",
              }}
            />
          </Suspense>
        </ErrorBoundary>
      </div>
    </>
  );
}
