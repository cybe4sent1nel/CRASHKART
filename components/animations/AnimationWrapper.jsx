"use client";

import dynamic from "next/dynamic";
import { useLoadAnimation } from "./useLoadAnimation";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

/**
 * Reusable animation wrapper component
 * Handles loading, error states, and URL encoding
 */
export default function AnimationWrapper({
  animationPath,
  width = "300px",
  height = "300px",
  loop = true,
  autoplay = true,
  speed = 1,
}) {
  const { animationData, error, isLoading } = useLoadAnimation(animationPath);

  // Error state
  if (error) {
    return (
      <div
        style={{
          width,
          height,
          background: "#f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            color: "#999",
            fontSize: "12px",
          }}
        >
          Animation load error
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading || !animationData) {
    return <div style={{ width, height }} />;
  }

  // Render animation
  return (
    <div style={{ width, height }}>
      <Lottie
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
        speed={speed}
      />
    </div>
  );
}
