"use client";

import { useState, useCallback } from "react";
import type { ToolType, CanvasToolState } from "@/types";

const defaultState: CanvasToolState = {
  activeTool: "pen",
  strokeColor: "#ff0000",
  strokeWidth: 3,
  fontSize: 16,
  fontColor: "#ffffff",
};

export function useCanvasTools() {
  const [toolState, setToolState] = useState<CanvasToolState>(defaultState);

  const setTool = useCallback((tool: ToolType) => {
    setToolState((prev) => ({ ...prev, activeTool: tool }));
  }, []);

  const setStrokeColor = useCallback((color: string) => {
    setToolState((prev) => ({ ...prev, strokeColor: color }));
  }, []);

  const setStrokeWidth = useCallback((width: number) => {
    setToolState((prev) => ({ ...prev, strokeWidth: width }));
  }, []);

  const setFontSize = useCallback((size: number) => {
    setToolState((prev) => ({ ...prev, fontSize: size }));
  }, []);

  const setFontColor = useCallback((color: string) => {
    setToolState((prev) => ({ ...prev, fontColor: color }));
  }, []);

  return {
    ...toolState,
    setTool,
    setStrokeColor,
    setStrokeWidth,
    setFontSize,
    setFontColor,
  };
}
