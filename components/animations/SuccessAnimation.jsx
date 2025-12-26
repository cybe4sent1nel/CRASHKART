"use client";

import AnimationWrapper from "./AnimationWrapper";

export default function SuccessAnimation({
  width = "300px",
  height = "300px",
  animationPath = "/animations/Success celebration.json",
}) {
  return (
    <AnimationWrapper
      animationPath={animationPath}
      width={width}
      height={height}
      loop={true}
      autoplay={true}
    />
  );
}
