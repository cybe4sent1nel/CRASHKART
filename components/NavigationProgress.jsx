"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function NavigationProgress() {
  const [isLoading, setIsLoading] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Initialize the flag if not set
    if (typeof window !== "undefined" && !window.__disableNavigationLoader) {
      window.__disableNavigationLoader = false;
    }

    const originalPush = router.push;
    const originalReplace = router.replace;

    router.push = function (...args) {
      // Check the flag BEFORE showing loader
      if (typeof window !== "undefined" && !window.__disableNavigationLoader) {
        setIsLoading(true);
        setLineIndex(Math.floor(Math.random() * wittyLines.length));
        setTimeout(() => setIsLoading(false), 2000);
      }
      return originalPush.apply(this, args);
    };

    router.replace = function (...args) {
      // Check the flag BEFORE showing loader
      if (typeof window !== "undefined" && !window.__disableNavigationLoader) {
        setIsLoading(true);
        setLineIndex(Math.floor(Math.random() * wittyLines.length));
        setTimeout(() => setIsLoading(false), 2000);
      }
      return originalReplace.apply(this, args);
    };

    // Listen for link clicks
    const handleLinkClick = (e) => {
      const target = e.target.closest("a");
      if (target && target.href && !target.hasAttribute("data-no-loader")) {
        // Check if it's an internal link
        try {
          const url = new URL(target.href);
          if (url.origin === window.location.origin) {
            if (!window.__disableNavigationLoader) {
              setIsLoading(true);
              setLineIndex(Math.floor(Math.random() * wittyLines.length));
              setTimeout(() => setIsLoading(false), 2000);
            }
          }
        } catch (e) {
          // Invalid URL, skip
        }
      }
    };

    document.addEventListener("click", handleLinkClick);

    return () => {
      document.removeEventListener("click", handleLinkClick);
    };
  }, [router]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-white z-[999] flex flex-col items-center justify-center gap-6">
      <CartLoaderAnimation width="150px" height="150px" />
      <p className="text-gray-700 text-lg font-medium">{wittyLines[lineIndex]}</p>
    </div>
  );
}
