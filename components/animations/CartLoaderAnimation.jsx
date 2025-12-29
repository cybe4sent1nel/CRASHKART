"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export default function CartLoaderAnimation({ width = "100px", height = "100px" }) {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch("/animations/Shopping%20Cart%20Loader.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Error loading cart loader animation:", err));
  }, []);

  if (!animationData) return <div style={{ width, height }} />;

  return (
    <div style={{ width, height }}>
      <Lottie animationData={animationData} loop autoplay />
    </div>
  );
}
