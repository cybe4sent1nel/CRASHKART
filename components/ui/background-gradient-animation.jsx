"use client";
import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const BackgroundGradientAnimation = ({
  children,
  className,
  containerClassName,
  ...props
}) => {
  return (
    <div className={cn("relative w-full overflow-hidden", containerClassName)}>
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <motion.linearGradient
            id="gradient"
            animate={{ x1: ["0%", "100%"], x2: ["0%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
          >
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </motion.linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#gradient)" />
      </svg>
      <div className={cn("relative z-10", className)}>
        {children}
      </div>
    </div>
  );
};
