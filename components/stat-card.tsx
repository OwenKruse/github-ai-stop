import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  accent?: "green" | "red" | "blue" | "orange";
  className?: string;
}

const accentColors = {
  green: "bg-notion-bg-green text-notion-green",
  red: "bg-notion-bg-red text-notion-red",
  blue: "bg-notion-bg-blue text-notion-blue",
  orange: "bg-notion-bg-orange text-notion-orange",
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  accent = "green",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card p-4 transition-colors hover:bg-accent/40",
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
        <div className={cn("rounded-md p-1.5", accentColors[accent])}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-foreground">{value}</span>
        {trend && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              trend.isPositive
                ? "text-notion-green"
                : "text-notion-red"
            )}
          >
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </span>
        )}
      </div>
    </div>
  );
}
