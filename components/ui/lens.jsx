"use client";
import React, { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const Lens = ({ children, zoomLevel = 1.5, lensSize = 150 }) => {
  const containerRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-lg"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {children}
      {isHovering && (
        <motion.div
          className="absolute pointer-events-none rounded-full border-2 border-white shadow-lg overflow-hidden"
          style={{
            width: lensSize,
            height: lensSize,
            left: position.x - lensSize / 2,
            top: position.y - lensSize / 2,
          }}
        >
          <div
            className="w-full h-full"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: `${(position.x / containerRef.current.offsetWidth) * 100}% ${(position.y / containerRef.current.offsetHeight) * 100}%`,
            }}
          >
            {children}
          </div>
        </motion.div>
      )}
    </div>
  );
};
