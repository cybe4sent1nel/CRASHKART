import { useEffect, useState } from "react";

/**
 * Custom hook to safely load Lottie animation files
 * Handles URL encoding for filenames with spaces
 * Provides error handling and loading states
 */
export function useLoadAnimation(animationPath) {
  const [animationData, setAnimationData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!animationPath) {
      setIsLoading(false);
      return;
    }

    // Normalize the path - URL encode spaces if not already encoded
    const normalizedPath = animationPath.includes(" ")
      ? animationPath.replace(/ /g, "%20")
      : animationPath;

    setIsLoading(true);
    setError(null);

    fetch(normalizedPath)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load animation: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        setAnimationData(data);
        setError(null);
      })
      .catch((err) => {
        console.error("Error loading animation:", err);
        setError(err.message);
        setAnimationData(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [animationPath]);

  return { animationData, error, isLoading };
}
