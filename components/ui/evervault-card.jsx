"use client";
import React, { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const EvervaultCard = ({ text = "Evervault" }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={cn(
        "relative w-full h-full rounded-xl p-8 border transition-all duration-300",
        isHovered ? "border-purple-500 bg-purple-50 dark:bg-slate-900" : "border-gray-200"
      )}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
    >
      <motion.div
        className="absolute inset-0 rounded-xl opacity-20"
        animate={{
          background: isHovered
            ? "radial-gradient(400px at 40% 40%, #9333ea, transparent)"
            : "radial-gradient(400px at 0% 0%, #9333ea, transparent)",
        }}
        transition={{ duration: 0.3 }}
      />
      <div className="relative z-10">
        <p className="text-lg font-semibold">{text}</p>
      </div>
    </motion.div>
  );
};
