import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ContributorAvatarProps {
  username: string;
  avatarUrl: string;
  size?: "sm" | "md" | "lg";
  showUsername?: boolean;
  className?: string;
}

export function ContributorAvatar({
  username,
  avatarUrl,
  size = "md",
  showUsername = false,
  className,
}: ContributorAvatarProps) {
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-7 w-7",
    lg: "h-9 w-9",
  };

  const getInitials = (name: string) => {
    return name
      .split("-")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (showUsername) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Avatar className={cn(sizeClasses[size], "shrink-0")}>
          <AvatarImage src={avatarUrl} alt={username} />
          <AvatarFallback className="bg-notion-bg-gray text-muted-foreground text-[10px]">
            {getInitials(username)}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm text-foreground">{username}</span>
      </div>
    );
  }

  return (
    <Avatar className={cn(sizeClasses[size], "shrink-0", className)}>
      <AvatarImage src={avatarUrl} alt={username} />
      <AvatarFallback className="bg-notion-bg-gray text-muted-foreground text-[10px]">
        {getInitials(username)}
      </AvatarFallback>
    </Avatar>
  );
}
