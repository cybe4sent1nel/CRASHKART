/**
 * Image Upload Helper - Handles both localhost (base64) and production (ImageKit)
 */

export const isProduction = () => {
  return process.env.NODE_ENV === "production" || 
         (typeof window !== "undefined" && 
          (window.location.hostname === "vercel.app" || 
           window.location.hostname.endsWith(".vercel.app") ||
           window.location.hostname === "github.io" ||
           window.location.hostname.endsWith(".github.io")));
};

/**
 * Upload image and return URL
 * On localhost: converts to base64
 * On production: uploads to ImageKit
 */
export const uploadImage = async (file, folder = "crashkart") => {
  // Localhost: use base64
  if (!isProduction()) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Production: use ImageKit
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("publicKey", process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY);
    formData.append("folder", `/${folder}`);

    // Get auth parameters
    const authResponse = await fetch("/api/imagekit/auth");
    const { signature, expire, token } = await authResponse.json();

    formData.append("signature", signature);
    formData.append("expire", expire);
    formData.append("token", token);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) throw new Error("Upload failed");

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error("ImageKit upload error:", error);
    throw error;
  }
};

/**
 * Delete image from ImageKit (production only)
 */
export const deleteImage = async (fileId) => {
  if (!isProduction()) return; // No deletion needed for base64

  try {
    const response = await fetch(`/api/imagekit/delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId }),
    });

    if (!response.ok) throw new Error("Delete failed");
    return await response.json();
  } catch (error) {
    console.error("ImageKit delete error:", error);
    throw error;
  }
};
