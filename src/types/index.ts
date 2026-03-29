export type Modality = "CT" | "MRI" | "X-Ray" | "Ultrasound" | "Other";

export type ToolType = "pen" | "highlighter" | "text" | "eraser";

export interface AnnotationLine {
  id: string;
  tool: "pen" | "highlighter";
  points: number[];
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
}

export interface AnnotationText {
  id: string;
  tool: "text";
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontColor: string;
}

export type Annotation = AnnotationLine | AnnotationText;

export interface CanvasToolState {
  activeTool: ToolType;
  strokeColor: string;
  strokeWidth: number;
  fontSize: number;
  fontColor: string;
}
