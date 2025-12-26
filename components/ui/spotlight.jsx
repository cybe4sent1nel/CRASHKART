"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const Spotlight = ({
  className,
  fill = "white",
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <motion.div
        className="pointer-events-none absolute"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div
          className="w-96 h-96 rounded-full opacity-30 blur-3xl"
          style={{
            background: `radial-gradient(circle, ${fill}, transparent)`,
          }}
        />
      </motion.div>
    </div>
  );
};
