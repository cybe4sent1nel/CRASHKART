"use client";

import Lottie from "lottie-react";
import animationData from "./404-animation-data.json";

export default function NotFoundAnimation({ width = "300px", height = "300px" }) {
  return (
    <div style={{ width, height }}>
      <Lottie animationData={animationData} loop={true} autoplay={true} />
    </div>
  );
}
