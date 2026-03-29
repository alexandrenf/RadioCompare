"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Stage, Layer, Line, Text, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import type { Annotation, AnnotationLine, AnnotationText, ToolType } from "@/types";
import type Konva from "konva";

interface AnnotationStageProps {
  imageUrl: string;
  annotations: Annotation[];
  activeTool: ToolType;
  strokeColor: string;
  strokeWidth: number;
  fontSize: number;
  fontColor: string;
  onAddAnnotation: (annotation: Annotation) => void;
  onUpdateAnnotation: (id: string, changes: Partial<Annotation>) => void;
  onRemoveAnnotation: (id: string) => void;
  readOnly?: boolean;
}

export function AnnotationStage({
  imageUrl,
  annotations,
  activeTool,
  strokeColor,
  strokeWidth,
  fontSize,
  fontColor,
  onAddAnnotation,
  onUpdateAnnotation,
  onRemoveAnnotation,
  readOnly = false,
}: AnnotationStageProps) {
  const [image] = useImage(imageUrl, "anonymous");
  const stageRef = useRef<Konva.Stage>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<number[]>([]);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textInputPos, setTextInputPos] = useState({ x: 0, y: 0 });
  const [textInputValue, setTextInputValue] = useState("");

  // Fit image to container
  useEffect(() => {
    if (!image || !containerRef.current) return;
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const imageAspect = image.width / image.height;
    const containerAspect = containerWidth / containerHeight;

    let newWidth, newHeight;
    if (imageAspect > containerAspect) {
      newWidth = containerWidth;
      newHeight = containerWidth / imageAspect;
    } else {
      newHeight = containerHeight;
      newWidth = containerHeight * imageAspect;
    }
    setStageSize({ width: newWidth, height: newHeight });
    setScale(newWidth / image.width);
  }, [image]);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (image && containerRef.current) {
        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const imageAspect = image.width / image.height;
        const containerAspect = containerWidth / containerHeight;
        let newWidth, newHeight;
        if (imageAspect > containerAspect) {
          newWidth = containerWidth;
          newHeight = containerWidth / imageAspect;
        } else {
          newHeight = containerHeight;
          newWidth = containerHeight * imageAspect;
        }
        setStageSize({ width: newWidth, height: newHeight });
        setScale(newWidth / image.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [image]);

  const getRelativePointerPosition = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    return { x: pos.x / scale, y: pos.y / scale };
  }, [scale]);

  const handleMouseDown = useCallback(() => {
    if (readOnly) return;
    const pos = getRelativePointerPosition();
    if (!pos) return;

    if (activeTool === "pen" || activeTool === "highlighter") {
      setIsDrawing(true);
      setCurrentLine([pos.x, pos.y]);
    } else if (activeTool === "text") {
      const stage = stageRef.current;
      if (!stage) return;
      const stagePos = stage.getPointerPosition();
      if (!stagePos) return;

      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      setTextInputPos({
        x: containerRect.left + stagePos.x,
        y: containerRect.top + stagePos.y,
      });
      setTextInputValue("");
      setEditingTextId("new");
    } else if (activeTool === "eraser") {
      const stage = stageRef.current;
      if (!stage) return;
      const clickedShape = stage.getIntersection(
        stage.getPointerPosition()!
      );
      if (clickedShape) {
        const id = clickedShape.id();
        if (id) onRemoveAnnotation(id);
      }
    }
  }, [activeTool, readOnly, getRelativePointerPosition, onRemoveAnnotation]);

  const handleMouseMove = useCallback(() => {
    if (!isDrawing || readOnly) return;
    const pos = getRelativePointerPosition();
    if (!pos) return;
    setCurrentLine((prev) => [...prev, pos.x, pos.y]);
  }, [isDrawing, readOnly, getRelativePointerPosition]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || readOnly) return;
    setIsDrawing(false);
    if (currentLine.length < 4) {
      setCurrentLine([]);
      return;
    }

    const annotation: AnnotationLine = {
      id: crypto.randomUUID(),
      tool: activeTool as "pen" | "highlighter",
      points: currentLine,
      strokeColor: strokeColor,
      strokeWidth:
        activeTool === "highlighter" ? Math.max(strokeWidth * 4, 20) : strokeWidth,
      opacity: activeTool === "highlighter" ? 0.4 : 1,
    };
    onAddAnnotation(annotation);
    setCurrentLine([]);
  }, [
    isDrawing,
    readOnly,
    currentLine,
    activeTool,
    strokeColor,
    strokeWidth,
    onAddAnnotation,
  ]);

  const handleTextSubmit = useCallback(() => {
    if (textInputValue.trim() && editingTextId) {
      const pos = getRelativePointerPosition();
      if (editingTextId === "new") {
        const stage = stageRef.current;
        const stagePos = stage?.getPointerPosition();
        const annotation: AnnotationText = {
          id: crypto.randomUUID(),
          tool: "text",
          text: textInputValue.trim(),
          x: stagePos ? stagePos.x / scale : 0,
          y: stagePos ? stagePos.y / scale : 0,
          fontSize,
          fontColor,
        };
        // Use the textInputPos to calculate relative position
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          annotation.x = (textInputPos.x - containerRect.left) / scale;
          annotation.y = (textInputPos.y - containerRect.top) / scale;
        }
        onAddAnnotation(annotation);
      } else {
        onUpdateAnnotation(editingTextId, { text: textInputValue.trim() } as Partial<AnnotationText>);
      }
    }
    setEditingTextId(null);
    setTextInputValue("");
  }, [
    editingTextId,
    textInputValue,
    fontSize,
    fontColor,
    scale,
    textInputPos,
    onAddAnnotation,
    onUpdateAnnotation,
    getRelativePointerPosition,
  ]);

  const handleTextDblClick = useCallback(
    (id: string, text: string, x: number, y: number) => {
      if (readOnly) return;
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      setEditingTextId(id);
      setTextInputValue(text);
      setTextInputPos({
        x: containerRect.left + x * scale,
        y: containerRect.top + y * scale,
      });
    },
    [readOnly, scale]
  );

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[400px]">
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={scale}
        scaleY={scale}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        className="border border-border rounded-md bg-black"
      >
        {/* Image Layer */}
        <Layer>
          {image && (
            <KonvaImage image={image} width={image.width} height={image.height} />
          )}
        </Layer>

        {/* Annotation Layer */}
        <Layer>
          {annotations.map((ann) => {
            if (ann.tool === "pen" || ann.tool === "highlighter") {
              const lineAnn = ann as AnnotationLine;
              return (
                <Line
                  key={lineAnn.id}
                  id={lineAnn.id}
                  points={lineAnn.points}
                  stroke={lineAnn.strokeColor}
                  strokeWidth={lineAnn.strokeWidth}
                  opacity={lineAnn.opacity}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation={
                    lineAnn.tool === "highlighter"
                      ? "multiply"
                      : "source-over"
                  }
                />
              );
            }
            if (ann.tool === "text") {
              const textAnn = ann as AnnotationText;
              return (
                <Text
                  key={textAnn.id}
                  id={textAnn.id}
                  x={textAnn.x}
                  y={textAnn.y}
                  text={textAnn.text}
                  fontSize={textAnn.fontSize}
                  fill={textAnn.fontColor}
                  draggable={!readOnly}
                  onDblClick={() =>
                    handleTextDblClick(
                      textAnn.id,
                      textAnn.text,
                      textAnn.x,
                      textAnn.y
                    )
                  }
                  onDragEnd={(e) => {
                    if (!readOnly) {
                      onUpdateAnnotation(textAnn.id, {
                        x: e.target.x(),
                        y: e.target.y(),
                      } as Partial<AnnotationText>);
                    }
                  }}
                />
              );
            }
            return null;
          })}

          {/* Current drawing line */}
          {isDrawing && currentLine.length >= 2 && (
            <Line
              points={currentLine}
              stroke={strokeColor}
              strokeWidth={
                activeTool === "highlighter"
                  ? Math.max(strokeWidth * 4, 20)
                  : strokeWidth
              }
              opacity={activeTool === "highlighter" ? 0.4 : 1}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={
                activeTool === "highlighter" ? "multiply" : "source-over"
              }
            />
          )}
        </Layer>
      </Stage>

      {/* Text input overlay */}
      {editingTextId && (
        <textarea
          autoFocus
          value={textInputValue}
          onChange={(e) => setTextInputValue(e.target.value)}
          onBlur={handleTextSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleTextSubmit();
            }
            if (e.key === "Escape") {
              setEditingTextId(null);
              setTextInputValue("");
            }
          }}
          className="fixed z-50 bg-transparent border border-white/50 text-white outline-none resize-none p-1 min-w-[100px]"
          style={{
            left: textInputPos.x,
            top: textInputPos.y,
            fontSize: `${fontSize}px`,
            color: fontColor,
          }}
        />
      )}
    </div>
  );
}

export function getStageDataUrl(stageRef: React.RefObject<Konva.Stage | null>): string | null {
  if (!stageRef.current) return null;
  return stageRef.current.toDataURL({ pixelRatio: 2 });
}
