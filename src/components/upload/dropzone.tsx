"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface ImageDropzoneProps {
  onImageSelect: (file: File, previewUrl: string) => void;
}

export function ImageDropzone({ onImageSelect }: ImageDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        const url = URL.createObjectURL(file);
        onImageSelect(file, url);
      }
    },
    [onImageSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"],
    },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center justify-center gap-4 p-12",
        "border-2 border-dashed rounded-lg cursor-pointer",
        "transition-colors duration-200",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
      )}
    >
      <input {...getInputProps()} aria-label="Upload radiology image" />
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        {isDragActive ? (
          <Upload className="h-8 w-8 text-primary" />
        ) : (
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <div className="text-center">
        <p className="text-lg font-medium">
          {isDragActive
            ? "Drop your image here"
            : "Drag & drop a radiology image"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          or click to browse. Supports PNG, JPG, WEBP, BMP, TIFF
        </p>
      </div>
    </div>
  );
}
