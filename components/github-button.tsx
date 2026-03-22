"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { cn } from "@/lib/utils";

interface GitHubButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function GitHubButton({
  className,
  children = "Sign in with GitHub",
}: GitHubButtonProps) {
  return (
    <Button
      size="lg"
      className={cn("gap-2", className)}
      onClick={() => signIn("github", { redirectTo: "/dashboard" })}
    >
      <Github className="h-5 w-5" />
      {children}
    </Button>
  );
}
