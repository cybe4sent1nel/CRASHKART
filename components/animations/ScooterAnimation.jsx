"use client";

import AnimationWrapper from "./AnimationWrapper";

export default function ScooterAnimation({
  width = "400px",
  height = "400px",
}) {
  return (
    <AnimationWrapper
      animationPath="/animations/Waiting the Courier.json"
      width={width}
      height={height}
      loop={true}
      autoplay={true}
    />
  );
}
