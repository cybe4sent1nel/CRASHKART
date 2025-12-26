"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import CartLoaderAnimation from "./animations/CartLoaderAnimation";

const wittyLines = [
  "Charging up your tech dreams...",
  "Loading awesomeness...",
  "Syncing your gadget desires...",
  "Buffering brilliance...",
  "Fetching the future...",
  "Installing happiness...",
  "Optimizing your shopping spree...",
  "Compiling your order...",
  "Processing tech magic...",
  "Downloading excellence...",
  "Your cart is getting smart...",
  "Initializing checkout...",
  "Booting up savings...",
  "Caching your favorites...",
  "Running checkout.exe...",
];

export default function RouteLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams]);

  // Listen for route changes with a small delay
  useEffect(() => {
    const handleStart = () => {
      setIsLoading(true);
      setLineIndex(Math.floor(Math.random() * wittyLines.length));
    };

    const handleComplete = () => {
      setTimeout(() => setIsLoading(false), 300);
    };

    // Simulate navigation start
    window.addEventListener("beforeunload", handleStart);

    return () => {
      window.removeEventListener("beforeunload", handleStart);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-white z-[999] flex flex-col items-center justify-center gap-6">
      <CartLoaderAnimation width="150px" height="150px" />
      <p className="text-gray-700 text-lg font-medium">{wittyLines[lineIndex]}</p>
    </div>
  );
}
