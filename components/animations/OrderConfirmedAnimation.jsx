"use client";

import AnimationWrapper from "./AnimationWrapper";

export default function OrderConfirmedAnimation({
  width = "300px",
  height = "300px",
}) {
  return (
    <AnimationWrapper
      animationPath="/animations/Order Confirmed.json"
      width={width}
      height={height}
      loop={true}
      autoplay={true}
    />
  );
}
