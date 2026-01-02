"use client";
import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const BackgroundBoxes = React.memo(function BackgroundBoxes({
  className,
  ...rest
}) {
  const [grid, setGrid] = React.useState({ columns: 1, rows: 1 });

  React.useEffect(() => {
    const cols = Math.max(1, Math.floor(window.innerWidth / 50));
    const rows = Math.max(1, Math.floor(window.innerHeight / 50));
    setGrid({ columns: cols, rows });
  }, []);

  const boxCount = grid.columns * grid.rows;
  const durations = React.useMemo(() => {
    // Deterministic pseudo-random durations to avoid impure Math.random during render
    return Array.from({ length: boxCount }, (_, i) => {
      const pseudo = ((i * 9301 + 49297) % 233280) / 233280;
      return 5 + pseudo * 5;
    });
  }, [boxCount]);

  if (!boxCount) return null;
  return (
    <div
      className={cn(
        "fixed inset-0 z-0 w-full h-full bg-slate-900",
        className
      )}
      {...rest}>
      <div className="absolute inset-0 w-full h-full bg-slate-900 z-20 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0 z-10">
        {Array.from({ length: boxCount }).map((_, i) => (
          <motion.div
            key={`${i}`}
            className="absolute w-[40px] h-[40px] border border-slate-700"
            style={{
              left: `${(i % grid.columns) * 50}px`,
              top: `${Math.floor(i / grid.columns) * 50}px`,
            }}
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: durations[i] || 5,
              repeat: Infinity,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
});
