"use client";
import React, { useEffect, useRef } from "react";

export const Globe = ({ className, config = {} }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    ctx.fillStyle = config.globeColor || "rgba(79, 172, 254, 0.2)";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = config.globeColor || "rgba(79, 172, 254, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
  }, [config]);

  return (
    <canvas
      ref={canvasRef}
      className={className || "w-full h-full"}
    />
  );
};
