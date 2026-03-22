"use client"

import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

const prVolumeChartConfig = {
  value: { label: "PRs", color: "var(--color-notion-green)" },
} satisfies ChartConfig

const trustScoreChartConfig = {
  value: { label: "Contributors", color: "var(--color-notion-blue)" },
} satisfies ChartConfig

const spamRateChartConfig = {
  value: { label: "Spam %", color: "var(--color-notion-red)" },
} satisfies ChartConfig

interface DashboardChartsProps {
  prVolumeData: { date: string; value: number }[]
  spamRateTrend: { date: string; value: number }[]
  trustScoreDistribution: { date: string; value: number; label?: string }[]
  totalPRs: number
}

export function DashboardCharts({
  prVolumeData,
  spamRateTrend,
  trustScoreDistribution,
  totalPRs,
}: DashboardChartsProps) {
  const lastSpam = spamRateTrend.at(-1)?.value ?? 0
  const firstSpam = spamRateTrend.at(0)?.value ?? 0
  const spamDelta = lastSpam - firstSpam

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        {/* PR Volume */}
        <div className="lg:col-span-2 rounded-md border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">PR Volume</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Last 8 days</p>
            </div>
            <span className="text-xs text-muted-foreground font-mono">{totalPRs} total</span>
          </div>
          <ChartContainer config={prVolumeChartConfig} className="h-[200px] w-full">
            <AreaChart data={prVolumeData}>
              <defs>
                <linearGradient id="prFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-notion-green)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="var(--color-notion-green)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="value" stroke="var(--color-notion-green)" fill="url(#prFill)" strokeWidth={1.5} />
            </AreaChart>
          </ChartContainer>
        </div>

        {/* Spam Rate */}
        <div className="rounded-md border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Spam Rate</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {spamDelta <= 0 ? "Trending down" : "Trending up"}
              </p>
            </div>
            <span className={`text-xs font-medium ${spamDelta <= 0 ? "text-notion-green" : "text-notion-red"}`}>
              {spamDelta <= 0 ? "" : "+"}{spamDelta.toFixed(1)}%
            </span>
          </div>
          <ChartContainer config={spamRateChartConfig} className="h-[200px] w-full">
            <LineChart data={spamRateTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="value" stroke="var(--color-notion-red)" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ChartContainer>
        </div>
      </div>

      {/* Trust Score Distribution */}
      <div className="rounded-md border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Trust Score Distribution</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Contributor breakdown by score range</p>
          </div>
        </div>
        <ChartContainer config={trustScoreChartConfig} className="h-[200px] w-full">
          <BarChart data={trustScoreDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="var(--color-notion-blue)" radius={[4, 4, 0, 0]} opacity={0.8} />
          </BarChart>
        </ChartContainer>
      </div>
    </>
  )
}
