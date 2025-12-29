"use client";
import React, { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";

export const PixelatedCanvas = ({ src, alt = "image", pixelSize = 10 }) => {
  const canvasRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    imgRef.current = img;

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;

      if (isHovered) {
        for (let y = 0; y < img.height; y += pixelSize) {
          for (let x = 0; x < img.width; x += pixelSize) {
            const imageData = ctx.getImageData(x, y, 1, 1);
            const pixel = imageData.data;
            ctx.fillStyle = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
            ctx.fillRect(x, y, pixelSize, pixelSize);
          }
        }
      } else {
        ctx.drawImage(img, 0, 0);
      }
    };
  }, [src, isHovered, pixelSize]);

  return (
    <motion.canvas
      ref={canvasRef}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      alt={alt}
      className="w-full h-auto cursor-pointer"
    />
  );
};
