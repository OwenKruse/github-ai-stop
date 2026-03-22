import { cn } from "@/lib/utils";

interface TrustScoreBadgeProps {
  score: number;
  size?: "sm" | "md";
  className?: string;
}

export function TrustScoreBadge({ score, size = "sm", className }: TrustScoreBadgeProps) {
  const getColor = (score: number) => {
    if (score >= 80) return "bg-notion-bg-green text-notion-green";
    if (score >= 60) return "bg-notion-bg-orange text-notion-orange";
    if (score >= 40) return "bg-notion-bg-blue text-notion-blue";
    return "bg-notion-bg-red text-notion-red";
  };

  const sizeClass = size === "md" ? "px-2 py-0.5 text-sm" : "px-1.5 py-0.5 text-xs";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded font-mono font-semibold tabular-nums",
        getColor(score),
        sizeClass,
        className
      )}
    >
      {score}
    </span>
  );
}
