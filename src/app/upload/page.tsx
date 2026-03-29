"use client";

import { useState, useCallback, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ImageDropzone } from "@/components/upload/dropzone";
import { AnnotationStage } from "@/components/canvas/annotation-stage";
import { Toolbar } from "@/components/canvas/toolbar";
import { useAnnotation } from "@/hooks/use-annotation";
import { useCanvasTools } from "@/hooks/use-canvas-tools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, X, Loader2 } from "lucide-react";
import type { Modality } from "@/types";

async function generateThumbnail(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX_WIDTH = 300;
      const scale = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => resolve(blob!),
        "image/jpeg",
        0.7
      );
    };
    img.src = URL.createObjectURL(file);
  });
}

export default function UploadPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [modality, setModality] = useState<Modality>("CT");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const annotation = useAnnotation();
  const tools = useCanvasTools();

  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const createStudy = useMutation(api.studies.create);

  const handleImageSelect = useCallback(
    (file: File, url: string) => {
      setImageFile(file);
      setPreviewUrl(url);
      setSaved(false);
    },
    []
  );

  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
    }
    setTagInput("");
  }, [tagInput, tags]);

  const handleRemoveTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "1") tools.setTool("pen");
      if (e.key === "2") tools.setTool("highlighter");
      if (e.key === "3") tools.setTool("text");
      if (e.key === "4") tools.setTool("eraser");
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        annotation.undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        annotation.redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tools, annotation]);

  const handleSave = useCallback(async () => {
    if (!imageFile || !name.trim()) return;
    setSaving(true);
    try {
      // Upload image
      const imageUploadUrl = await generateUploadUrl();
      const imageResponse = await fetch(imageUploadUrl, {
        method: "POST",
        headers: { "Content-Type": imageFile.type },
        body: imageFile,
      });
      const { storageId: imageStorageId } = await imageResponse.json();

      // Upload thumbnail
      const thumbnailBlob = await generateThumbnail(imageFile);
      const thumbUploadUrl = await generateUploadUrl();
      const thumbResponse = await fetch(thumbUploadUrl, {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: thumbnailBlob,
      });
      const { storageId: thumbnailStorageId } = await thumbResponse.json();

      // Create study
      await createStudy({
        name: name.trim(),
        description: description.trim(),
        modality,
        tags,
        imageStorageId,
        thumbnailStorageId,
        annotations: JSON.stringify(annotation.annotations),
      });

      setSaved(true);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  }, [
    imageFile,
    name,
    description,
    modality,
    tags,
    annotation.annotations,
    generateUploadUrl,
    createStudy,
  ]);

  const handleReset = useCallback(() => {
    setImageFile(null);
    setPreviewUrl(null);
    setName("");
    setDescription("");
    setModality("CT");
    setTags([]);
    setTagInput("");
    setSaved(false);
    annotation.clear();
  }, [annotation]);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">Upload & Annotate</h1>
        <p className="text-sm text-muted-foreground">
          Upload a radiology image, annotate it, and save to your library
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {!previewUrl ? (
          <div className="max-w-2xl mx-auto mt-12">
            <ImageDropzone onImageSelect={handleImageSelect} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 h-full">
            {/* Canvas area */}
            <div className="flex flex-col gap-3 min-h-0">
              <Toolbar
                activeTool={tools.activeTool}
                strokeColor={tools.strokeColor}
                strokeWidth={tools.strokeWidth}
                fontSize={tools.fontSize}
                fontColor={tools.fontColor}
                canUndo={annotation.canUndo}
                canRedo={annotation.canRedo}
                onToolChange={tools.setTool}
                onStrokeColorChange={tools.setStrokeColor}
                onStrokeWidthChange={tools.setStrokeWidth}
                onFontSizeChange={tools.setFontSize}
                onFontColorChange={tools.setFontColor}
                onUndo={annotation.undo}
                onRedo={annotation.redo}
                onClear={annotation.clear}
              />
              <div className="flex-1 min-h-[400px]">
                <AnnotationStage
                  imageUrl={previewUrl}
                  annotations={annotation.annotations}
                  activeTool={tools.activeTool}
                  strokeColor={tools.strokeColor}
                  strokeWidth={tools.strokeWidth}
                  fontSize={tools.fontSize}
                  fontColor={tools.fontColor}
                  onAddAnnotation={annotation.addAnnotation}
                  onUpdateAnnotation={annotation.updateAnnotation}
                  onRemoveAnnotation={annotation.removeAnnotation}
                />
              </div>
            </div>

            {/* Metadata sidebar */}
            <div className="space-y-4 border-l pl-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Lung nodule - RUL"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what you see..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modality">Modality</Label>
                <Select
                  value={modality}
                  onValueChange={(val) => setModality(val as Modality)}
                >
                  <SelectTrigger id="modality">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CT">CT</SelectItem>
                    <SelectItem value="MRI">MRI</SelectItem>
                    <SelectItem value="X-Ray">X-Ray</SelectItem>
                    <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddTag}
                    type="button"
                  >
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="gap-1 cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag}
                        <X className="h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 space-y-2">
                <Button
                  onClick={handleSave}
                  disabled={!name.trim() || saving}
                  className="w-full"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {saving ? "Saving..." : saved ? "Saved!" : "Save Study"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="w-full"
                >
                  New Upload
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
