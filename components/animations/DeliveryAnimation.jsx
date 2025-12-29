"use client";

import AnimationWrapper from "./AnimationWrapper";

export default function DeliveryAnimation({
  width = "300px",
  height = "300px",
}) {
  return (
    <AnimationWrapper
      animationPath="/animations/Warehouse and delivery.json"
      width={width}
      height={height}
      loop={true}
      autoplay={true}
    />
  );
}
