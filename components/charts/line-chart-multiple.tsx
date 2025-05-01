"use client"

import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
const chartData = [
  { month: "一月", desktop: 186, mobile: 80 },
  { month: "二月", desktop: 305, mobile: 200 },
  { month: "三月", desktop: 237, mobile: 120 },
  { month: "四月", desktop: 73, mobile: 190 },
  { month: "五月", desktop: 209, mobile: 130 },
  { month: "六月", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "桌面端",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "移动端",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function LineChartMultiple() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>折线图 - 多线条</CardTitle>
        <CardDescription>2024年1月 - 6月</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 2)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              dataKey="desktop"
              type="monotone"
              stroke="var(--color-desktop)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="mobile"
              type="monotone"
              stroke="var(--color-mobile)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-pretty text-center text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          本月上升趋势为5.2% <TrendingUp className="size-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          显示过去6个月的访问者总数
        </div>
      </CardFooter>
    </Card>
  )
}
