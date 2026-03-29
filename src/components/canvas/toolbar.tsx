"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Pen,
  Highlighter,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Palette,
} from "lucide-react";
import type { ToolType } from "@/types";

const COLORS = [
  "#ff0000",
  "#ff6600",
  "#ffff00",
  "#00ff00",
  "#00ffff",
  "#0066ff",
  "#ff00ff",
  "#ffffff",
  "#000000",
];

interface ToolbarProps {
  activeTool: ToolType;
  strokeColor: string;
  strokeWidth: number;
  fontSize: number;
  fontColor: string;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: ToolType) => void;
  onStrokeColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onFontSizeChange: (size: number) => void;
  onFontColorChange: (color: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}

export function Toolbar({
  activeTool,
  strokeColor,
  strokeWidth,
  fontSize,
  fontColor,
  canUndo,
  canRedo,
  onToolChange,
  onStrokeColorChange,
  onStrokeWidthChange,
  onFontSizeChange,
  onFontColorChange,
  onUndo,
  onRedo,
  onClear,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-card border border-border rounded-lg">
      {/* Tool selection */}
      <ToggleGroup
        value={[activeTool]}
        onValueChange={(val) => {
          if (val.length > 0) onToolChange(val[val.length - 1] as ToolType);
        }}
        aria-label="Drawing tools"
      >
        <ToggleGroupItem value="pen" aria-label="Pen tool (1)" title="Pen (1)">
          <Pen className="h-4 w-4" />
        </ToggleGroupItem>

        <ToggleGroupItem
          value="highlighter"
          aria-label="Highlighter tool (2)"
          title="Highlighter (2)"
        >
          <Highlighter className="h-4 w-4" />
        </ToggleGroupItem>

        <ToggleGroupItem
          value="text"
          aria-label="Text tool (3)"
          title="Text (3)"
        >
          <Type className="h-4 w-4" />
        </ToggleGroupItem>

        <ToggleGroupItem
          value="eraser"
          aria-label="Eraser tool (4)"
          title="Eraser (4)"
        >
          <Eraser className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Separator */}
      <div className="h-6 w-px bg-border" />

      {/* Color picker */}
      <Popover>
        <PopoverTrigger
          className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted h-8 w-8 relative"
          aria-label="Pick color"
        >
          <Palette className="h-4 w-4" />
          <span
            className="absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full border border-border"
            style={{
              backgroundColor:
                activeTool === "text" ? fontColor : strokeColor,
            }}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <div className="space-y-3">
            <Label className="text-xs">
              {activeTool === "text" ? "Font Color" : "Stroke Color"}
            </Label>
            <div className="flex gap-1.5 flex-wrap max-w-[180px]">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor:
                      (activeTool === "text" ? fontColor : strokeColor) ===
                      color
                        ? "white"
                        : "transparent",
                  }}
                  onClick={() =>
                    activeTool === "text"
                      ? onFontColorChange(color)
                      : onStrokeColorChange(color)
                  }
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Size controls */}
      <Popover>
        <PopoverTrigger
          className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted h-8 px-2.5 text-xs font-medium"
        >
          Size
        </PopoverTrigger>
        <PopoverContent className="w-48 p-3" align="start">
          <div className="space-y-3">
            {activeTool === "text" ? (
              <>
                <Label className="text-xs">Font Size: {fontSize}px</Label>
                <Slider
                  value={[fontSize]}
                  onValueChange={(_val, _e) => {
                    if (Array.isArray(_val)) onFontSizeChange(_val[0]);
                  }}
                  min={10}
                  max={48}
                  step={1}
                />
              </>
            ) : (
              <>
                <Label className="text-xs">
                  Stroke Width: {strokeWidth}px
                </Label>
                <Slider
                  value={[strokeWidth]}
                  onValueChange={(_val, _e) => {
                    if (Array.isArray(_val)) onStrokeWidthChange(_val[0]);
                  }}
                  min={1}
                  max={20}
                  step={1}
                />
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Separator */}
      <div className="h-6 w-px bg-border" />

      {/* Undo/Redo */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onRedo}
        disabled={!canRedo}
        aria-label="Redo"
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo2 className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onClear}
        aria-label="Clear all annotations"
        title="Clear All"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
