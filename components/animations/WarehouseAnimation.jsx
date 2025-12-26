"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export default function WarehouseAnimation({ width = "300px", height = "300px" }) {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch("/animations/Warehouse%20and%20delivery.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Error loading warehouse animation:", err));
  }, []);

  if (!animationData) return <div style={{ width, height }} />;

  return (
    <div style={{ width, height }}>
      <Lottie animationData={animationData} loop autoplay />
    </div>
  );
}
