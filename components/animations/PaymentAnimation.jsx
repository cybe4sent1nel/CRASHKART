"use client";

import AnimationWrapper from "./AnimationWrapper";

export default function PaymentAnimation({
  width = "300px",
  height = "300px",
}) {
  return (
    <AnimationWrapper
      animationPath="/animations/pos mastercard.json"
      width={width}
      height={height}
      loop={true}
      autoplay={true}
    />
  );
}
