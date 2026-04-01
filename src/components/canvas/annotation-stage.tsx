"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  Stage,
  Layer,
  Line,
  Text,
  Transformer,
  Image as KonvaImage,
} from "react-konva";
import useImage from "use-image";
import type {
  Annotation,
  AnnotationLine,
  AnnotationText,
  ToolType,
} from "@/types";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const textNodeRefs = useRef<Record<string, Konva.Text | null>>({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<number[]>([]);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [textInputPos, setTextInputPos] = useState({ x: 0, y: 0 });
  const [textInputValue, setTextInputValue] = useState("");

  const editingTextAnnotation =
    editingTextId && editingTextId !== "new"
      ? annotations.find(
          (annotation): annotation is AnnotationText =>
            annotation.tool === "text" && annotation.id === editingTextId
        ) ?? null
      : null;

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

  // Ensure selectedTextId is valid based on current state (derived state approach)
  const validSelectedTextId =
    activeTool === "text" &&
    selectedTextId &&
    annotations.some(
      (a) => a.tool === "text" && a.id === selectedTextId
    )
      ? selectedTextId
      : null;

  // Sync back to state if it became invalid to avoid stale references in handlers
  // though we mostly rely on validSelectedTextId for rendering
  useEffect(() => {
    if (selectedTextId !== validSelectedTextId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTextId(validSelectedTextId);
    }
  }, [selectedTextId, validSelectedTextId]);

  // Clean up unused textRefs to prevent memory leaks
  useEffect(() => {
    const validIds = new Set(annotations.map((a) => a.id));
    for (const id in textNodeRefs.current) {
      if (!validIds.has(id)) {
        delete textNodeRefs.current[id];
      }
    }
  }, [annotations]);

  // Clean up unused textRefs to prevent memory leaks
  useEffect(() => {
    const validIds = new Set(annotations.map((a) => a.id));
    for (const id in textNodeRefs.current) {
      if (!validIds.has(id)) {
        delete textNodeRefs.current[id];
      }
    }
  }, [annotations]);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    const selectedNode =
      activeTool === "text" && !editingTextId && validSelectedTextId
        ? textNodeRefs.current[validSelectedTextId] ?? null
        : null;

    transformer.nodes(selectedNode ? [selectedNode] : []);
    transformer.getLayer()?.batchDraw();
  }, [activeTool, annotations, editingTextId, validSelectedTextId]);

  const startTextEditing = useCallback(
    (position: { x: number; y: number }, value = "", id: string | null = "new") => {
      setTextInputPos(position);
      setTextInputValue(value);
      setEditingTextId(id);
      setSelectedTextId(id === "new" ? null : id);
    },
    []
  );

  const cancelTextEditing = useCallback(() => {
    if (editingTextId && editingTextId !== "new") {
      setSelectedTextId(editingTextId);
    }
    setEditingTextId(null);
    setTextInputValue("");
  }, [editingTextId]);

  const handleMouseDown = useCallback(() => {
    if (readOnly || editingTextId) return;
    if (activeTool !== "pen" && activeTool !== "highlighter") return;

    const pos = getRelativePointerPosition();
    if (!pos) return;

    setSelectedTextId(null);
    setIsDrawing(true);
    setCurrentLine([pos.x, pos.y]);
  }, [activeTool, editingTextId, readOnly, getRelativePointerPosition]);

  const handleClick = useCallback(
    (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (readOnly || editingTextId) return;

      const stage = stageRef.current;
      if (!stage) return;

      const target = event.target;
      const isBackgroundTarget =
        target === stage || target.getClassName() === "Image";

      if (activeTool === "text") {
        if (!isBackgroundTarget) return;

        if (selectedTextId) {
          setSelectedTextId(null);
          return;
        }

        const stagePos = stage.getPointerPosition();
        if (!stagePos) return;

        startTextEditing({
          x: stagePos.x,
          y: stagePos.y,
        });
        return;
      }

      if (activeTool === "eraser") {
        if (isBackgroundTarget) {
          setSelectedTextId(null);
          return;
        }

        const id = target.id();
        if (id) {
          onRemoveAnnotation(id);
          if (selectedTextId === id) {
            setSelectedTextId(null);
          }
        }
        return;
      }

      if (isBackgroundTarget) {
        setSelectedTextId(null);
      }
    },
    [
      activeTool,
      editingTextId,
      onRemoveAnnotation,
      readOnly,
      selectedTextId,
      startTextEditing,
    ]
  );

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
      strokeColor,
      strokeWidth: getRenderedStrokeWidth(activeTool, strokeWidth),
      opacity: activeTool === "highlighter" ? 0.4 : 1,
    };

    onAddAnnotation(annotation);
    setCurrentLine([]);
  }, [
    activeTool,
    currentLine,
    isDrawing,
    onAddAnnotation,
    readOnly,
    strokeColor,
    strokeWidth,
  ]);

  const handleTextSubmit = useCallback(() => {
    const trimmedValue = textInputValue.trim();

    if (trimmedValue && editingTextId) {
      if (editingTextId === "new") {
        const annotationId = crypto.randomUUID();
        const annotation: AnnotationText = {
          id: annotationId,
          tool: "text",
          text: trimmedValue,
          x: textInputPos.x / scale,
          y: textInputPos.y / scale,
          fontSize,
          fontColor,
        };
        onAddAnnotation(annotation);
        setSelectedTextId(annotationId);
      } else {
        onUpdateAnnotation(editingTextId, {
          text: trimmedValue,
        } as Partial<AnnotationText>);
        setSelectedTextId(editingTextId);
      }
    }

    setEditingTextId(null);
    setTextInputValue("");
  }, [
    editingTextId,
    fontColor,
    fontSize,
    onAddAnnotation,
    onUpdateAnnotation,
    scale,
    textInputPos,
    textInputValue,
  ]);

  const handleTextNodeSelect = useCallback(
    (
      event: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
      id: string
    ) => {
      if (readOnly || activeTool !== "text" || editingTextId) return;

      event.cancelBubble = true;
      setSelectedTextId(id);
    },
    [activeTool, editingTextId, readOnly]
  );

  const handleTextDblClick = useCallback(
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

  const handleTextTransformEnd = useCallback(
    (id: string, node: Konva.Text) => {
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      node.scaleX(1);
      node.scaleY(1);

      onUpdateAnnotation(id, {
        x: node.x(),
        y: node.y(),
        width: Math.max(60, node.width() * scaleX),
        fontSize: Math.max(10, node.fontSize() * scaleY),
      } as Partial<AnnotationText>);
      setSelectedTextId(id);
    },
    [onUpdateAnnotation]
  );

  const handleTextDragEnd = useCallback(
    (
      id: string,
      event: Konva.KonvaEventObject<DragEvent>
    ) => {
      if (readOnly || activeTool !== "text") return;

      onUpdateAnnotation(id, {
        x: event.target.x(),
        y: event.target.y(),
      } as Partial<AnnotationText>);
      setSelectedTextId(id);
    },
    [activeTool, onUpdateAnnotation, readOnly]
  );

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-100 w-full overflow-hidden"
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
          <Layer>
            {image && (
              <KonvaImage image={image} width={image.width} height={image.height} />
            )}
          </Layer>

          <Layer>
            {annotations.map((annotation) => {
              if (annotation.tool === "pen" || annotation.tool === "highlighter") {
                const lineAnnotation = annotation as AnnotationLine;

                return (
                  <Line
                    key={lineAnnotation.id}
                    id={lineAnnotation.id}
                    points={lineAnnotation.points}
                    stroke={lineAnnotation.strokeColor}
                    strokeWidth={lineAnnotation.strokeWidth}
                    opacity={lineAnnotation.opacity}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation={
                      lineAnnotation.tool === "highlighter"
                        ? "multiply"
                        : "source-over"
                    }
                  />
                );
              }

              if (annotation.tool === "text") {
                const textAnnotation = annotation as AnnotationText;

                return (
                  <Text
                    key={textAnnotation.id}
                    id={textAnnotation.id}
                    x={textAnnotation.x}
                    y={textAnnotation.y}
                    text={textAnnotation.text}
                    width={textAnnotation.width}
                    fontSize={textAnnotation.fontSize}
                    fill={textAnnotation.fontColor}
                    draggable={!readOnly && activeTool === "text"}
                    onClick={(event) =>
                      handleTextNodeSelect(event, textAnnotation.id)
                    }
                    onTap={(event) =>
                      handleTextNodeSelect(event, textAnnotation.id)
                    }
                    onDblClick={(event) =>
                      handleTextDblClick(
                        event,
                        textAnnotation.id,
                        textAnnotation.text,
                        textAnnotation.x,
                        textAnnotation.y
                      )
                    }
                    onDblTap={(event) =>
                      handleTextDblClick(
                        event,
                        textAnnotation.id,
                        textAnnotation.text,
                        textAnnotation.x,
                        textAnnotation.y
                      )
                    }
                    onDragEnd={(event) =>
                      handleTextDragEnd(textAnnotation.id, event)
                    }
                    onTransformEnd={(event) =>
                      handleTextTransformEnd(
                        textAnnotation.id,
                        event.target as Konva.Text
                      )
                    }
                    ref={(node) => {
                      textNodeRefs.current[textAnnotation.id] = node;
                    }}
                  />
                );
              }

              return null;
            })}

            {!readOnly && activeTool === "text" && selectedTextId && !editingTextId && (
              <Transformer
                ref={transformerRef}
                rotateEnabled={false}
                flipEnabled={false}
                enabledAnchors={[
                  "top-left",
                  "top-right",
                  "middle-left",
                  "middle-right",
                  "bottom-left",
                  "bottom-right",
                ]}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 60 || newBox.height < 24) {
                    return oldBox;
                  }

                  return newBox;
                }}
              />
            )}

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

      {editingTextId && (
        <textarea
          ref={textInputRef}
          value={textInputValue}
          onChange={(event) => setTextInputValue(event.target.value)}
          onBlur={handleTextSubmit}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleTextSubmit();
            }

            if (event.key === "Escape") {
              cancelTextEditing();
            }
          }}
          className="absolute z-10 min-h-10 min-w-35 resize-none rounded-sm border border-white/60 bg-black/70 p-1 text-white outline-none"
          style={{
            left: textInputPos.x,
            top: textInputPos.y,
            width: editingTextAnnotation?.width
              ? editingTextAnnotation.width * scale
              : undefined,
            fontSize: `${editingTextAnnotation?.fontSize ?? fontSize}px`,
            color: editingTextAnnotation?.fontColor ?? fontColor,
          }}
        />
      )}
    </div>
  );
}

export function getStageDataUrl(
  stageRef: React.RefObject<Konva.Stage | null>
): string | null {
  if (!stageRef.current) return null;

  return stageRef.current.toDataURL({ pixelRatio: 2 });
}
