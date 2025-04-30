"use client";

import * as React from "react";
import Link from "next/link";
import { ScrapeMeta } from "@prisma/client";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { isLink, removeUrlSuffix, timeAgo } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  request: {
    label: "请求数",
    color: "hsl(var(--chart-2))",
  },
  ip: {
    label: "IP数",
    color: "hsl(var(--chart-1))",
  },
};

function processUrlMeta(urlMetaArray: ScrapeMeta[]) {
  const dailyData: { [key: string]: { clicks: number; ips: Set<string> } } = {};

  urlMetaArray.forEach((meta) => {
    const createdDate = new Date(meta.createdAt).toISOString().split("T")[0];
    const updatedDate = new Date(meta.updatedAt).toISOString().split("T")[0];

    // Record for created date
    if (!dailyData[createdDate]) {
      dailyData[createdDate] = { clicks: 0, ips: new Set<string>() };
    }
    dailyData[createdDate].clicks += 1;
    dailyData[createdDate].ips.add(meta.ip);

    // If updated date is different, record additional clicks on that date
    if (createdDate !== updatedDate) {
      if (!dailyData[updatedDate]) {
        dailyData[updatedDate] = { clicks: 0, ips: new Set<string>() };
      }
      dailyData[updatedDate].clicks += meta.click - 1; // Subtract the initial click
      dailyData[updatedDate].ips.add(meta.ip);
    }
  });

  return Object.entries(dailyData).map(([date, data]) => ({
    date,
    clicks: data.clicks,
    uniqueIPs: data.ips.size,
    ips: Array.from(data.ips),
  }));
}

function calculateUVAndPV(logs: ScrapeMeta[]) {
  const uniqueIps = new Set<string>();
  let totalClicks = 0;

  logs.forEach((log) => {
    uniqueIps.add(log.ip);
    totalClicks += log.click;
  });

  return {
    ip: uniqueIps.size,
    request: totalClicks,
  };
}

interface Stat {
  dimension: string;
  clicks: number;
  percentage: string;
}

export function DailyPVUVChart({ data }: { data: ScrapeMeta[] }) {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("request");

  const processedData = processUrlMeta(data)
    .map((entry) => ({
      date: entry.date,
      request: entry.clicks,
      ip: new Set(entry.ips).size,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const dataTotal = calculateUVAndPV(data);

  const sort_data = data.sort(
    (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
  );
  const latestEntry = sort_data[sort_data.length - 1];
  const latestDate = timeAgo(latestEntry.updatedAt);
  const latestFrom = latestEntry.type;

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-2 sm:py-3">
          <CardTitle>API总请求量</CardTitle>
          <CardDescription>
            最近一次请求来自 <strong>{latestFrom}</strong> API，约 {latestDate}。
          </CardDescription>
        </div>
        <div className="flex">
          {["request", "ip"].map((key) => {
            const chart = key as keyof typeof chartConfig;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="relative z-30 flex flex-1 flex-col items-center justify-center gap-1 border-t px-6 py-2 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-3"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-xs text-muted-foreground">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg font-bold leading-none">
                  {dataTotal[key as keyof typeof dataTotal].toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[225px] w-full"
        >
          <AreaChart
            accessibilityLayer
            data={processedData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <defs>
              <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={`var(--color-ip)`}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={`var(--color-ip)`}
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={`var(--color-request)`}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={`var(--color-request)`}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("zh-CN", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("zh-CN", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                />
              }
            />
            {/* <Bar dataKey="ip" fill={`var(--color-ip)`} stackId="a" />
            <Bar dataKey="request" fill={`var(--color-request)`} stackId="a" /> */}

            <Area
              type="monotone"
              dataKey="ip"
              stroke={`var(--color-ip)`}
              fillOpacity={1}
              fill="url(#colorUv)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="request"
              stroke={`var(--color-request)`}
              fillOpacity={1}
              fill="url(#colorPv)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>

        {/* <VisSingleContainer data={{ areas: areaData }}>
          <VisTopoJSONMap topojson={WorldMapTopoJSON} />
          <VisTooltip triggers={triggers} />
        </VisSingleContainer> */}
        {/* 
        <div className="my-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {refererStats.length > 0 && (
            <StatsList data={refererStats} title="Referrers" />
          )}
          {cityStats.length > 0 && (
            <StatsList data={cityStats} title="Cities" />
          )}
          {browserStats.length > 0 && (
            <StatsList data={browserStats} title="Browsers" />
          )}
          {deviceStats.length > 0 && (
            <StatsList data={deviceStats} title="Devices" />
          )}
        </div> */}
      </CardContent>
    </Card>
  );
}

export function DailyTopUsageChart({ data }: { data: ScrapeMeta[] }) {
  const metadata = React.useMemo(() => {
    const typeMap: Record<string, { count: number; lastUsed: Date }> = {};

    // 统计每个type的使用次数和最近使用时间
    data.forEach((entry) => {
      const type = entry.type;
      if (!typeMap[type]) {
        typeMap[type] = { count: 0, lastUsed: new Date(0) };
      }
      typeMap[type].count += entry.click;
      const entryDate = new Date(entry.updatedAt);
      if (entryDate > typeMap[type].lastUsed) {
        typeMap[type].lastUsed = entryDate;
      }
    });

    // 转换为数组并按使用次数排序
    return Object.entries(typeMap)
      .map(([type, stats]) => ({
        type,
        count: stats.count,
        lastUsed: stats.lastUsed,
      }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const totalClicks = metadata.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>API类型使用统计</CardTitle>
        <CardDescription>
          您最常使用的API类型及其使用频率
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metadata.map((item) => (
            <div key={item.type} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{item.type}</span>
                <span className="text-muted-foreground text-xs">
                  {timeAgo(item.lastUsed)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{item.count}</span>
                <span className="text-xs text-muted-foreground">
                  {((item.count / totalClicks) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsList({ data, title }: { data: Stat[]; title: string }) {
  return (
    <div className="rounded-xl border p-2">
      <div className="mb-4 flex items-center justify-between px-4 pt-4">
        <h3 className="text-sm font-medium">{title}</h3>
      </div>

      <div className="-mx-2 flex flex-col gap-1">
        {data.map((stat) => (
          <div
            key={stat.dimension}
            className="flex items-center justify-between rounded-lg px-4 py-2 hover:bg-muted/50"
          >
            <div className="truncate text-sm">
              {isLink(stat.dimension) ? (
                <Link
                  href={stat.dimension}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 truncate text-blue-700 hover:underline"
                >
                  {removeUrlSuffix(stat.dimension)}
                </Link>
              ) : (
                stat.dimension
              )}
            </div>
            <div className="flex items-center gap-1">
              <div className="text-sm tabular-nums text-muted-foreground">
                {stat.clicks.toLocaleString()}
              </div>
              <div className="w-10 text-right text-xs text-muted-foreground">
                {stat.percentage}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
