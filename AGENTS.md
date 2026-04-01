<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->

## Project Overview

RadioCompare is a radiology study companion for annotating, comparing, and learning from medical images.

**Stack**: Next.js 16 (App Router) + Convex 1.34 + Konva/react-konva + Tailwind CSS 4 + TypeScript 5

**Key domain types** (defined in `src/types/index.ts`):
- `Modality`: `"CT" | "MRI" | "X-Ray" | "Ultrasound" | "Other"`
- `ToolType`: `"pen" | "highlighter" | "text" | "eraser"`
- `Annotation`: `AnnotationLine | AnnotationText`
- `AnnotationLine`: `{ id, tool: "pen"|"highlighter", points: number[], strokeColor, strokeWidth, opacity }`
- `AnnotationText`: `{ id, tool: "text", text, x, y, fontSize, fontColor, width? }`
- `CanvasToolState`: `{ activeTool, strokeColor, strokeWidth, fontSize, fontColor }`

## Code Conventions

### File Organization
- App routes live in `src/app/` using Next.js App Router conventions
- Reusable components go in `src/components/<feature>/`
- Shared UI primitives go in `src/components/ui/` (shadcn/ui base-nova style)
- Custom hooks in `src/hooks/`
- Utilities in `src/lib/`
- Convex backend functions in `convex/` (schema.ts, studies.ts, normals.ts, storage.ts)

### Component Patterns
- All interactive components use `"use client"` directive
- UI components use `@base-ui/react` primitives (NOT radix-ui), with `class-variance-authority` for variants
- Use `cn()` from `@/lib/utils` for Tailwind class merging
- Use `data-slot` attributes on UI component root elements
- Components use `lucide-react` for icons
- Use `render` prop pattern for polymorphic components (e.g., `Button render={<Link href="..." />}`)

### Convex Patterns
- Always read `convex/_generated/ai/guidelines.md` before modifying backend code
- Use `v` from `convex/values` for argument validators on all functions
- Schema is in `convex/schema.ts`
- Use `api.module.function` references for public functions, `internal.module.function` for internal
- File storage uses `ctx.storage.getUrl()` for signed URLs, `generateUploadUrl` mutation for uploads
- Thumbnails are generated client-side before upload (300px max width, JPEG 0.7 quality)
- Annotations are stored as JSON-serialized strings in the `annotations` field

### Annotation System
- Canvas is Konva-based (`react-konva`), rendered in `annotation-stage.tsx`
- `useAnnotation` hook manages state with `useReducer` and undo/redo history stack
- `useCanvasTools` hook manages active tool, colors, sizes
- Keyboard shortcuts: `1-4` for tools, `Ctrl+Z` undo, `Ctrl+Shift+Z` redo (bound in page components)
- Highlighter uses `globalCompositeOperation: "multiply"` and 1.5x stroke width multiplier
- Text annotations support inline editing, dragging, and transformer-based resizing

### UI Component Details
- Button: uses `@base-ui/react/button`, supports `render` prop for polymorphism
- Dialog/Sheet: uses `@base-ui/react/dialog`, `showCloseButton` prop defaults to true
- Select: uses `@base-ui/react/select`, `alignItemWithTrigger` support
- Sidebar: full sidebar system with collapsible modes (offcanvas/icon/none), mobile sheet fallback
- All components use Tailwind CSS v4 with CSS custom properties for theming

### State Management
- No global state library — uses React hooks + Convex real-time queries
- `useAnnotation`: reducer with history (ADD, UPDATE, REMOVE, UNDO, REDO, SET_ALL, CLEAR)
- `useCanvasTools`: simple useState with memoized setters
- Convex queries use `"skip"` pattern for conditional fetching (e.g., `isSearching ? "skip" : { modality }`)

## Lint & Typecheck

Run before committing:
```bash
npm run lint
npm run typecheck  # if available, otherwise rely on IDE/tsc
```
