"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export default function HelpDeskAnimation({ width = "300px", height = "300px", loop = true }) {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch("/animations/Helpdesk.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Error loading helpdesk animation:", err));
  }, []);

  if (!animationData) return <div style={{ width, height }} />;

  return (
    <div style={{ width, height }}>
      <Lottie animationData={animationData} loop={loop} autoplay />
    </div>
  );
}
