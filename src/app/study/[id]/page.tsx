"use client";

import { use, useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Save, Loader2, ArrowLeft, Trash2, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDisplayDate } from "@/lib/format-date";
import type { Modality, Annotation } from "@/types";

export default function StudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const study = useQuery(api.studies.getById, {
    id: id as Id<"studies">,
  });
  const updateStudy = useMutation(api.studies.update);
  const removeStudy = useMutation(api.studies.remove);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [modality, setModality] = useState<Modality>("CT");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const annotation = useAnnotation();
  const tools = useCanvasTools();

  // Initialize form when study loads
  useEffect(() => {
    if (study && !initialized) {
      setName(study.name);
      setDescription(study.description);
      setModality(study.modality);
      setTags(study.tags);
      try {
        const parsed = JSON.parse(study.annotations) as Annotation[];
        annotation.setAll(parsed);
      } catch {
        // ignore parse errors
      }
      setInitialized(true);
    }
  }, [study, initialized, annotation]);

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

  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
    }
    setTagInput("");
  }, [tagInput, tags]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateStudy({
        id: id as Id<"studies">,
        name: name.trim(),
        description: description.trim(),
        modality,
        tags,
        annotations: JSON.stringify(annotation.annotations),
      });
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  }, [id, name, description, modality, tags, annotation.annotations, updateStudy]);

  const handleDelete = useCallback(async () => {
    await removeStudy({ id: id as Id<"studies"> });
    router.push("/library");
  }, [id, removeStudy, router]);

  if (study === undefined) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (study === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-lg">Study not found</p>
        <Button render={<Link href="/library" />} className="mt-4">
          Back to Library
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" render={<Link href="/library" />}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{study.name}</h1>
            <p className="text-sm text-muted-foreground">
              {study.modality} &middot; {formatDisplayDate(study.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
          <Dialog>
            <DialogTrigger render={<Button variant="destructive" size="icon" />}>
              <Trash2 className="h-4 w-4" />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Study</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete &quot;{study.name}&quot;? This
                  action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-4">
        <div className="grid h-full min-h-0 grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
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
              {study.imageUrl && (
                <AnnotationStage
                  imageUrl={study.imageUrl}
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
              )}
            </div>
          </div>

          {/* Metadata sidebar */}
          <div className="space-y-4 border-l pl-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modality">Modality</Label>
              <Select
                value={modality}
                onValueChange={(val) => val && setModality(val as Modality)}
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
                <Button variant="outline" size="sm" onClick={handleAddTag}>
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
                      onClick={() =>
                        setTags((prev) => prev.filter((t) => t !== tag))
                      }
                    >
                      {tag}
                      <X className="h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
