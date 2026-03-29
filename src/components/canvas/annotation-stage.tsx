"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Stage, Layer, Line, Text, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import type { Annotation, AnnotationLine, AnnotationText, ToolType } from "@/types";
import type Konva from "konva";

const HIGHLIGHTER_WIDTH_MULTIPLIER = 1.5;
const HIGHLIGHTER_MIN_WIDTH = 6;

function getRenderedStrokeWidth(tool: ToolType, strokeWidth: number) {
  if (tool !== "highlighter") {
    return strokeWidth;
  }

  return Math.max(
    Math.round(strokeWidth * HIGHLIGHTER_WIDTH_MULTIPLIER),
    HIGHLIGHTER_MIN_WIDTH
  );
}

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
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textInputPos, setTextInputPos] = useState({ x: 0, y: 0 });
  const [textInputValue, setTextInputValue] = useState("");

  const updateStageDimensions = useCallback(() => {
    if (!image || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    if (containerWidth <= 0 || containerHeight <= 0) return;

    const nextScale = Math.min(
      containerWidth / image.width,
      containerHeight / image.height
    );
    if (!Number.isFinite(nextScale) || nextScale <= 0) return;

    const nextWidth = Math.max(1, Math.round(image.width * nextScale));
    const nextHeight = Math.max(1, Math.round(image.height * nextScale));

    setStageSize((prev) =>
      prev.width === nextWidth && prev.height === nextHeight
        ? prev
        : { width: nextWidth, height: nextHeight }
    );
    setScale((prev) =>
      Math.abs(prev - nextScale) < 0.001 ? prev : nextScale
    );
  }, [image]);

  useEffect(() => {
    if (!containerRef.current) return;

    updateStageDimensions();

    const observer = new ResizeObserver(() => {
      updateStageDimensions();
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [updateStageDimensions]);

  const getRelativePointerPosition = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    return { x: pos.x / scale, y: pos.y / scale };
  }, [scale]);

  useEffect(() => {
    if (!editingTextId || !textInputRef.current) return;

    const frame = requestAnimationFrame(() => {
      const input = textInputRef.current;
      if (!input) return;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });

    return () => cancelAnimationFrame(frame);
  }, [editingTextId]);

  const startTextEditing = useCallback(
    (position: { x: number; y: number }, value = "", id: string | null = "new") => {
      setTextInputPos(position);
      setTextInputValue(value);
      setEditingTextId(id);
    },
    []
  );

  const handleMouseDown = useCallback(() => {
    if (readOnly || editingTextId) return;
    const pos = getRelativePointerPosition();
    if (!pos) return;

    if (activeTool === "pen" || activeTool === "highlighter") {
      setIsDrawing(true);
      setCurrentLine([pos.x, pos.y]);
    }
  }, [activeTool, editingTextId, readOnly, getRelativePointerPosition]);

  const handleClick = useCallback(() => {
    if (readOnly || editingTextId) return;

    if (activeTool === "text") {
      const stage = stageRef.current;
      if (!stage) return;
      const stagePos = stage.getPointerPosition();
      if (!stagePos) return;

      startTextEditing({
        x: stagePos.x,
        y: stagePos.y,
      });
      return;
    }

    if (activeTool === "eraser") {
      const stage = stageRef.current;
      if (!stage) return;
      const pointerPosition = stage.getPointerPosition();
      if (!pointerPosition) return;

      const clickedShape = stage.getIntersection(pointerPosition);
      if (clickedShape) {
        const id = clickedShape.id();
        if (id) onRemoveAnnotation(id);
      }
    }
  }, [activeTool, editingTextId, readOnly, onRemoveAnnotation, startTextEditing]);

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
      strokeWidth: getRenderedStrokeWidth(activeTool, strokeWidth),
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
      if (editingTextId === "new") {
        const annotation: AnnotationText = {
          id: crypto.randomUUID(),
          tool: "text",
          text: textInputValue.trim(),
          x: textInputPos.x / scale,
          y: textInputPos.y / scale,
          fontSize,
          fontColor,
        };
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
  ]);

  const handleTextNodeClick = useCallback(
    (
      event: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
      id: string,
      text: string,
      x: number,
      y: number
    ) => {
      if (readOnly || activeTool !== "text") return;
      event.cancelBubble = true;
      startTextEditing(
        {
          x: x * scale,
          y: y * scale,
        },
        text,
        id
      );
    },
    [activeTool, readOnly, scale, startTextEditing]
  );

  const handleTextDblClick = useCallback(
    (id: string, text: string, x: number, y: number) => {
      if (readOnly) return;
      startTextEditing(
        {
          x: x * scale,
          y: y * scale,
        },
        text,
        id
      );
    },
    [readOnly, scale, startTextEditing]
  );

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-[400px] w-full overflow-hidden"
    >
      <div className="absolute inset-0">
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          scaleX={scale}
          scaleY={scale}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          onTap={handleClick}
          className="rounded-md border border-border bg-black"
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
                    onClick={(event) =>
                      handleTextNodeClick(
                        event,
                        textAnn.id,
                        textAnn.text,
                        textAnn.x,
                        textAnn.y
                      )
                    }
                    onTap={(event) =>
                      handleTextNodeClick(
                        event,
                        textAnn.id,
                        textAnn.text,
                        textAnn.x,
                        textAnn.y
                      )
                    }
                    onDblClick={() =>
                      handleTextDblClick(
                        textAnn.id,
                        textAnn.text,
                        textAnn.x,
                        textAnn.y
                      )
                    }
                    onDblTap={() =>
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
                strokeWidth={getRenderedStrokeWidth(activeTool, strokeWidth)}
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
      </div>

      {/* Text input overlay */}
      {editingTextId && (
        <textarea
          ref={textInputRef}
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
          className="absolute z-10 min-h-[2.5rem] min-w-[140px] resize-none rounded-sm border border-white/60 bg-black/70 p-1 text-white outline-none"
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
