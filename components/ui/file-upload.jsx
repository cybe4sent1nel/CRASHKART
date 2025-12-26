"use client";
import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const FileUpload = ({ onChange }) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(newFiles);
      onChange?.(newFiles);
    }
  };

  const handleChange = (e) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles(newFiles);
    onChange?.(newFiles);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <motion.div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={handleClick}
      className={cn(
        "relative p-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
        dragActive
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 hover:border-gray-400"
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleChange}
        className="hidden"
      />
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">
          Drag files here or click to select
        </p>
        {files.length > 0 && (
          <div className="mt-4">
            {files.map((file, idx) => (
              <p key={idx} className="text-xs text-gray-500">
                {file.name}
              </p>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
