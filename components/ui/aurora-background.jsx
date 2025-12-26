"use client";
import React from "react";
import { cn } from "@/lib/utils";

export const AuroraBackground = React.memo(function AuroraBackground({
  children,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        "relative w-full min-h-screen bg-slate-950 text-slate-50 transition-bg",
        className
      )}
      {...props}>
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 w-96 h-96 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-3xl bg-blue-600 animate-pulse" />
        <div className="absolute top-0 right-0 w-96 h-96 translate-x-1/3 -translate-y-1/2 rounded-full opacity-20 blur-3xl bg-purple-600 animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 translate-y-1/2 rounded-full opacity-20 blur-3xl bg-green-600 animate-pulse" style={{ animationDelay: "2s" }} />
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
});
