"use client";

import { ChevronsUpDown } from "lucide-react";
import { IKContext, IKUpload } from "imagekitio-react";
import { useRef, useState } from "react";

export default function ImageKitUpload({ 
  onUploadSuccess, 
  onError,
  folder = "crashkart",
  className = ""
}) {
  const ikUploadRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const onError_internal = (err) => {
    setUploading(false);
    console.error("Upload error:", err);
    onError?.(err);
  };

  const onSuccess = (res) => {
    setUploading(false);
    console.log("Upload successful:", res);
    onUploadSuccess?.({
      url: res.url,
      fileId: res.fileId,
      name: res.name,
      filePath: res.filePath,
    });
  };

  const authenticator = async () => {
    try {
      const response = await fetch("/api/imagekit/auth");
      if (!response.ok) throw new Error("Auth failed");
      const data = await response.json();
      const { signature, expire, token } = data;
      return { signature, expire, token };
    } catch (error) {
      throw new Error(`Authentication request failed: ${error.message}`);
    }
  };

  return (
    <IKContext
      publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY}
      urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}
      authenticator={authenticator}
    >
      <IKUpload
        ref={ikUploadRef}
        fileName="image.png"
        folder={`/${folder}`}
        onError={onError_internal}
        onSuccess={onSuccess}
        onChange={() => setUploading(true)}
        accept="image/*"
        className={`hidden ${className}`}
      />

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          ikUploadRef.current?.click();
        }}
        disabled={uploading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronsUpDown size={18} />
        {uploading ? "Uploading..." : "Upload Image"}
      </button>
    </IKContext>
  );
}
