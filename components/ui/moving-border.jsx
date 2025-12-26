"use client";
import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const MovingBorder = ({
  children,
  className,
  containerClassName,
  borderClassName,
  duration = 2000,
  ...props
}) => {
  return (
    <div className={cn("relative group", containerClassName)} {...props}>
      <motion.div
        className={cn(
          "absolute inset-0 rounded-lg z-0",
          borderClassName || "bg-gradient-to-r from-transparent via-white to-transparent"
        )}
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          duration: duration / 1000,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <div className={cn("relative z-10 bg-slate-900 rounded-lg", className)}>
        {children}
      </div>
    </div>
  );
};
