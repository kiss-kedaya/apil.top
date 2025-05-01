"use client";

import { TrendingUp } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  { month: "一月", desktop: 186 },
  { month: "二月", desktop: 305 },
  { month: "三月", desktop: 237 },
  { month: "四月", desktop: 273 },
  { month: "五月", desktop: 209 },
  { month: "六月", desktop: 214 },
];

const chartConfig = {
  desktop: {
    label: "桌面端",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function RadarChartSimple() {
  return (
    <Card>
      {/* <CardHeader className="items-center pb-4">
        <CardTitle>雷达图</CardTitle>
        <CardDescription>
          显示过去6个月的访问者总数
        </CardDescription>
      </CardHeader> */}
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[350px] 2xl:max-h-[250px]"
        >
          <RadarChart data={chartData}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="month" />
            <PolarGrid />
            <Radar
              dataKey="desktop"
              fill="var(--color-desktop)"
              fillOpacity={0.6}
              isAnimationActive={false}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-pretty text-center text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          本月上升趋势为5.2% <TrendingUp className="size-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          2024年1月 - 6月
        </div>
      </CardFooter>
    </Card>
  );
}
