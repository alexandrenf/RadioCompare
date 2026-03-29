"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageDropzone } from "@/components/upload/dropzone";
import { formatDisplayDate } from "@/lib/format-date";
import { Plus, Search, ScanLine, Trash2, Loader2 } from "lucide-react";

const BODY_REGIONS = [
  "Head",
  "Neck",
  "Chest",
  "Abdomen",
  "Pelvis",
  "Spine",
  "Upper Extremity",
  "Lower Extremity",
  "Other",
];

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
      canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.7);
    };
    img.src = URL.createObjectURL(file);
  });
}

export default function NormalsPage() {
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{
    file: File;
    url: string;
  } | null>(null);

  // Upload form
  const [name, setName] = useState("");
  const [bodyRegion, setBodyRegion] = useState("Head");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  const isSearching = searchQuery.trim().length > 0;
  const regionParam = regionFilter === "all" ? undefined : regionFilter;

  const listResults = useQuery(
    api.normals.list,
    isSearching ? "skip" : { bodyRegion: regionParam }
  );
  const searchResults = useQuery(
    api.normals.search,
    isSearching ? { query: searchQuery.trim(), bodyRegion: regionParam } : "skip"
  );

  const normals = isSearching ? searchResults : listResults;

  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const createNormal = useMutation(api.normals.create);
  const removeNormal = useMutation(api.normals.remove);

  const handleUpload = useCallback(async () => {
    if (!selectedImage || !name.trim()) return;
    setUploading(true);
    try {
      const imageUploadUrl = await generateUploadUrl();
      const imageResponse = await fetch(imageUploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedImage.file.type },
        body: selectedImage.file,
      });
      const { storageId: imageStorageId } = await imageResponse.json();

      const thumbnailBlob = await generateThumbnail(selectedImage.file);
      const thumbUploadUrl = await generateUploadUrl();
      const thumbResponse = await fetch(thumbUploadUrl, {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: thumbnailBlob,
      });
      const { storageId: thumbnailStorageId } = await thumbResponse.json();

      await createNormal({
        name: name.trim(),
        bodyRegion,
        description: description.trim(),
        imageStorageId,
        thumbnailStorageId,
      });

      // Reset form
      setName("");
      setBodyRegion("Head");
      setDescription("");
      setSelectedImage(null);
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to upload:", error);
    } finally {
      setUploading(false);
    }
  }, [
    selectedImage,
    name,
    bodyRegion,
    description,
    generateUploadUrl,
    createNormal,
  ]);

  const [viewingImage, setViewingImage] = useState<string | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Normal Scans</h1>
          <p className="text-sm text-muted-foreground">
            Reference database of normal radiology scans
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" />
            Add Normal
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Normal Scan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {!selectedImage ? (
                <ImageDropzone
                  onImageSelect={(file, url) =>
                    setSelectedImage({ file, url })
                  }
                />
              ) : (
                <div className="relative">
                  <img
                    src={selectedImage.url}
                    alt="Preview"
                    className="w-full rounded-md max-h-48 object-contain bg-black"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setSelectedImage(null)}
                  >
                    Change
                  </Button>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="normal-name">Name *</Label>
                <Input
                  id="normal-name"
                  placeholder="e.g., Normal chest CT - axial"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body-region">Body Region</Label>
                <Select value={bodyRegion} onValueChange={(v) => v && setBodyRegion(v)}>
                  <SelectTrigger id="body-region">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BODY_REGIONS.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="normal-desc">Description</Label>
                <Textarea
                  id="normal-desc"
                  placeholder="Anatomical notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                onClick={handleUpload}
                disabled={!selectedImage || !name.trim() || uploading}
                className="w-full"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {uploading ? "Uploading..." : "Add to Database"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Search and filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search normal scans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={regionFilter}
            onValueChange={(v) => v && setRegionFilter(v)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Body Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {BODY_REGIONS.map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {normals === undefined ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-video w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : normals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ScanLine className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium">No normal scans yet</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Add normal reference scans to build your comparison database
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {normals.map((normal) => (
              <Card
                key={normal._id}
                className="overflow-hidden group cursor-pointer"
                onClick={() =>
                  setViewingImage(
                    viewingImage === normal._id ? null : normal._id
                  )
                }
              >
                <div className="aspect-video bg-black relative overflow-hidden">
                  {normal.thumbnailUrl ? (
                    <img
                      src={normal.thumbnailUrl}
                      alt={normal.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No preview
                    </div>
                  )}
                  <Badge className="absolute top-2 right-2" variant="secondary">
                    {normal.bodyRegion}
                  </Badge>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium truncate">{normal.name}</h3>
                  {normal.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {normal.description}
                    </p>
                  )}
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDisplayDate(normal.createdAt)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNormal({ id: normal._id });
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Full view dialog */}
        {viewingImage && (
          <Dialog
            open={!!viewingImage}
            onOpenChange={() => setViewingImage(null)}
          >
            <DialogContent className="max-w-4xl">
              {(() => {
                const normal = normals?.find((n) => n._id === viewingImage);
                if (!normal) return null;
                return (
                  <>
                    <DialogHeader>
                      <DialogTitle>{normal.name}</DialogTitle>
                    </DialogHeader>
                    <div className="bg-black rounded-md overflow-hidden">
                      {normal.imageUrl && (
                        <img
                          src={normal.imageUrl}
                          alt={normal.name}
                          className="w-full max-h-[70vh] object-contain"
                        />
                      )}
                    </div>
                    {normal.description && (
                      <p className="text-sm text-muted-foreground">
                        {normal.description}
                      </p>
                    )}
                  </>
                );
              })()}
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
