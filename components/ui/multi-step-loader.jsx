"use client";
import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const MultiStepLoader = ({ steps = [], loading = true, loaderProps }) => {
  return (
    <div className={cn("w-full h-full flex items-center justify-center", loaderProps?.className)}>
      <div className="flex flex-col gap-8">
        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            className="flex items-center gap-4"
            animate={{
              opacity: loading ? 1 : 0.5,
            }}
          >
            <motion.div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                idx < steps.length
                  ? "bg-blue-500 text-white"
                  : "bg-gray-300 text-gray-500"
              )}
              animate={
                loading &&
                idx === Math.floor(steps.length * 0.5)
                  ? { scale: [1, 1.2, 1] }
                  : {}
              }
              transition={{ duration: 1, repeat: Infinity }}
            >
              {idx + 1}
            </motion.div>
            <span className={cn("text-sm", idx < steps.length ? "text-gray-700" : "text-gray-400")}>
              {step}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
