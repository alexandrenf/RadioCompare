"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Columns2 } from "lucide-react";

function ImagePanel({
  imageUrl,
  title,
}: {
  imageUrl: string | null;
  title: string;
}) {
  if (!imageUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg border-2 border-dashed">
        <p className="text-muted-foreground">Select an image</p>
      </div>
    );
  }
  return (
    <div className="h-full bg-black rounded-lg overflow-hidden">
      <img
        src={imageUrl}
        alt={title}
        className="w-full h-full object-contain"
      />
    </div>
  );
}

export default function ComparePage() {
  const [leftType, setLeftType] = useState<"study" | "normal">("study");
  const [rightType, setRightType] = useState<"normal" | "study">("normal");
  const [leftId, setLeftId] = useState<string>("");
  const [rightId, setRightId] = useState<string>("");

  const studies = useQuery(api.studies.list, {});
  const normals = useQuery(api.normals.list, {});

  const leftStudy = useQuery(
    api.studies.getById,
    leftType === "study" && leftId
      ? { id: leftId as Id<"studies"> }
      : "skip"
  );
  const leftNormal = useQuery(
    api.normals.getById,
    leftType === "normal" && leftId
      ? { id: leftId as Id<"normals"> }
      : "skip"
  );
  const rightStudy = useQuery(
    api.studies.getById,
    rightType === "study" && rightId
      ? { id: rightId as Id<"studies"> }
      : "skip"
  );
  const rightNormal = useQuery(
    api.normals.getById,
    rightType === "normal" && rightId
      ? { id: rightId as Id<"normals"> }
      : "skip"
  );

  const leftImage =
    leftType === "study"
      ? leftStudy?.imageUrl ?? null
      : leftNormal?.imageUrl ?? null;
  const leftTitle =
    leftType === "study"
      ? leftStudy?.name ?? ""
      : leftNormal?.name ?? "";

  const rightImage =
    rightType === "study"
      ? rightStudy?.imageUrl ?? null
      : rightNormal?.imageUrl ?? null;
  const rightTitle =
    rightType === "study"
      ? rightStudy?.name ?? ""
      : rightNormal?.name ?? "";

  const leftItems =
    leftType === "study" ? studies : normals;
  const rightItems =
    rightType === "study" ? studies : normals;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">Compare</h1>
        <p className="text-sm text-muted-foreground">
          Compare your studies side-by-side with normal scans
        </p>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4 min-h-0">
        {/* Controls */}
        <div className="grid grid-cols-2 gap-8">
          {/* Left panel controls */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Left Panel</Label>
            <div className="flex gap-2">
              <Tabs
                value={leftType}
                onValueChange={(v) => {
                  setLeftType(v as "study" | "normal");
                  setLeftId("");
                }}
              >
                <TabsList className="h-9">
                  <TabsTrigger value="study" className="text-xs">
                    Study
                  </TabsTrigger>
                  <TabsTrigger value="normal" className="text-xs">
                    Normal
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Select value={leftId} onValueChange={(v) => v && setLeftId(v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select image..." />
                </SelectTrigger>
                <SelectContent>
                  {leftItems?.map((item) => (
                    <SelectItem key={item._id} value={item._id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right panel controls */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Right Panel</Label>
            <div className="flex gap-2">
              <Tabs
                value={rightType}
                onValueChange={(v) => {
                  setRightType(v as "study" | "normal");
                  setRightId("");
                }}
              >
                <TabsList className="h-9">
                  <TabsTrigger value="study" className="text-xs">
                    Study
                  </TabsTrigger>
                  <TabsTrigger value="normal" className="text-xs">
                    Normal
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Select value={rightId} onValueChange={(v) => v && setRightId(v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select image..." />
                </SelectTrigger>
                <SelectContent>
                  {rightItems?.map((item) => (
                    <SelectItem key={item._id} value={item._id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Comparison panels */}
        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          <ImagePanel imageUrl={leftImage} title={leftTitle} />
          <ImagePanel imageUrl={rightImage} title={rightTitle} />
        </div>

        {!leftId && !rightId && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <Columns2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Select images from the dropdowns above to compare
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
