# RadioCompare

A radiology study companion web application for annotating, comparing, and learning from medical images. Built with Next.js 16, Convex, and Konva.

## Key Features

- **Image Upload & Annotation** — Upload radiology images (CT, MRI, X-Ray, Ultrasound) and annotate them with pen, highlighter, text, and eraser tools on a Konva-based canvas
- **Study Library** — Browse, search, and filter saved studies by modality with full-text search
- **Normal Scan Reference Database** — Maintain a library of normal reference scans organized by body region (Head, Neck, Chest, Abdomen, Pelvis, Spine, Extremities)
- **Side-by-Side Comparison** — Compare studies against normal references in a dual-panel view
- **Undo/Redo History** — Full annotation history with keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z)
- **Dark/Light Theme** — System-aware theme toggle with smooth transitions
- **Responsive Design** — Sidebar navigation with collapsible mobile support

## System Requirements

- **Node.js** >= 18.17
- **Bun** (recommended) or npm/yarn/pnpm
- **Convex** account ([convex.dev](https://convex.dev))

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd RadioCompare

# Install dependencies
bun install
# or
npm install

# Set up Convex
npx convex dev

# Create .env.local with your Convex deployment URL
echo "NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud" > .env.local
```

## Quick Start

```bash
# Start the Convex backend (in one terminal)
npx convex dev

# Start the Next.js dev server (in another terminal)
bun dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

### First Steps

1. Navigate to **Upload & Annotate** from the sidebar
2. Drag and drop a radiology image (PNG, JPG, WEBP, BMP, TIFF)
3. Use the annotation toolbar to draw, highlight, or add text
4. Fill in study metadata (name, description, modality, tags)
5. Click **Save** to store the study in your library
6. Visit **My Library** to browse saved studies
7. Use **Compare** to view studies side-by-side with normal references

## Project Structure

```
RadioCompare/
├── convex/                          # Backend (Convex)
│   ├── schema.ts                    # Database schema (studies, normals tables)
│   ├── studies.ts                   # Study CRUD operations and search
│   ├── normals.ts                   # Normal scan CRUD operations and search
│   ├── storage.ts                   # File upload URL generation
│   └── _generated/                  # Auto-generated Convex types and API
│       ├── api.d.ts / api.js        # API reference utilities
│       ├── server.d.ts / server.js  # Server-side function builders
│       ├── dataModel.d.ts           # Database type definitions
│       └── ai/guidelines.md         # Convex usage guidelines
├── src/
│   ├── app/                         # Next.js App Router pages
│   │   ├── page.tsx                 # Dashboard (home)
│   │   ├── layout.tsx               # Root layout with sidebar + providers
│   │   ├── globals.css              # Tailwind + theme variables
│   │   ├── upload/page.tsx          # Upload & annotate new images (330 lines)
│   │   ├── library/page.tsx         # Browse saved studies (89 lines)
│   │   ├── normals/page.tsx         # Manage normal reference scans (378 lines)
│   │   ├── compare/page.tsx         # Side-by-side comparison (202 lines)
│   │   └── study/[id]/page.tsx      # Edit existing study (319 lines)
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── annotation-stage.tsx # Konva canvas for drawing annotations (605 lines)
│   │   │   └── toolbar.tsx          # Annotation tool controls (287 lines)
│   │   ├── layout/
│   │   │   └── sidebar.tsx          # App navigation sidebar (96 lines)
│   │   ├── library/
│   │   │   ├── study-card.tsx       # Study card for grid display (75 lines)
│   │   │   └── search-bar.tsx       # Search with modality filter (57 lines)
│   │   ├── upload/
│   │   │   └── dropzone.tsx         # Drag-and-drop image upload (66 lines)
│   │   ├── ui/                      # 22 shadcn/ui components (base-nova style)
│   │   │   ├── button.tsx           # Button with variants/sizes
│   │   │   ├── badge.tsx            # Badge with variants
│   │   │   ├── card.tsx             # Card system (Card, Header, Title, etc.)
│   │   │   ├── command.tsx          # Command palette (cmdk)
│   │   │   ├── dialog.tsx           # Modal dialogs
│   │   │   ├── input.tsx            # Text input
│   │   │   ├── input-group.tsx      # Input with addons
│   │   │   ├── label.tsx            # Form labels
│   │   │   ├── popover.tsx          # Popover panels
│   │   │   ├── scroll-area.tsx      # Custom scrollbars
│   │   │   ├── select.tsx           # Dropdown select
│   │   │   ├── separator.tsx        # Horizontal/vertical dividers
│   │   │   ├── sheet.tsx            # Slide-over panels
│   │   │   ├── sidebar.tsx          # Sidebar system (723 lines)
│   │   │   ├── skeleton.tsx         # Loading placeholders
│   │   │   ├── slider.tsx           # Range slider
│   │   │   ├── switch.tsx           # Toggle switch
│   │   │   ├── tabs.tsx             # Tabbed interface
│   │   │   ├── textarea.tsx         # Multi-line text input
│   │   │   ├── toggle.tsx           # Toggle button
│   │   │   ├── toggle-group.tsx     # Grouped toggle buttons
│   │   │   └── tooltip.tsx          # Hover tooltips
│   │   └── providers.tsx            # Convex, Theme, Tooltip providers
│   ├── hooks/
│   │   ├── use-annotation.ts        # Annotation state with undo/redo (155 lines)
│   │   ├── use-canvas-tools.ts      # Active tool state management (45 lines)
│   │   └── use-mobile.ts            # Mobile viewport detection (19 lines)
│   ├── lib/
│   │   ├── utils.ts                 # Tailwind class merging (cn)
│   │   └── format-date.ts           # Date formatting utility
│   └── types/
│       └── index.ts                 # TypeScript type definitions
├── .kilo/                           # Kilo AI agent configuration
├── .agents/skills/                  # Convex agent skills
├── package.json
├── tsconfig.json
├── next.config.ts
├── eslint.config.mjs
├── components.json                  # shadcn/ui configuration
└── AGENTS.md                        # AI agent instructions
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL | Yes |

### Convex Schema

The application uses two database tables:

**studies** — Radiology study records
- `name`, `description`, `modality` (CT/MRI/X-Ray/Ultrasound/Other)
- `tags` (string array), `annotations` (JSON-serialized)
- `imageStorageId`, `thumbnailStorageId` (Convex file storage references)
- Indexes: `by_modality`, `by_created`, `search_studies` (full-text)

**normals** — Normal reference scan records
- `name`, `bodyRegion`, `description`
- `imageStorageId`, `thumbnailStorageId`
- Indexes: `by_region`, `by_created`, `search_normals` (full-text)

### Modality Types

Supported imaging modalities: `CT`, `MRI`, `X-Ray`, `Ultrasound`, `Other`

### Body Regions

Supported regions for normal scans: `Head`, `Neck`, `Chest`, `Abdomen`, `Pelvis`, `Spine`, `Upper Extremity`, `Lower Extremity`, `Other`

## Usage

### Annotation Tools

| Tool | Description | Shortcut |
|------|-------------|----------|
| Pen | Freehand drawing | `1` |
| Highlighter | Semi-transparent freehand | `2` |
| Text | Place text annotations | `3` |
| Eraser | Remove annotations | `4` |

Additional controls: color picker (9 colors), stroke/font size slider, undo (`Ctrl+Z`), redo (`Ctrl+Shift+Z`), clear all.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `1` | Select Pen tool |
| `2` | Select Highlighter tool |
| `3` | Select Text tool |
| `4` | Select Eraser tool |
| `Ctrl+Z` | Undo last annotation |
| `Ctrl+Shift+Z` | Redo annotation |
| `Ctrl+B` | Toggle sidebar |

### Custom Hooks

| Hook | Purpose |
|------|---------|
| `useAnnotation` | Manages annotation state with undo/redo history via `useReducer`. Actions: ADD, UPDATE, REMOVE, UNDO, REDO, SET_ALL, CLEAR |
| `useCanvasTools` | Manages canvas tool state: active tool, stroke color/width, font size/color |
| `useIsMobile` | Detects mobile viewport (< 768px) using `matchMedia` |

## Troubleshooting

**Convex connection errors**
- Ensure `npx convex dev` is running in a separate terminal
- Verify `NEXT_PUBLIC_CONVEX_URL` in `.env.local` matches your deployment

**Image upload fails**
- Check Convex storage is enabled in your deployment dashboard
- Supported formats: PNG, JPG, WEBP, BMP, TIFF

**Annotations not saving**
- Annotations are serialized as JSON; ensure the canvas has loaded before saving
- Check browser console for serialization errors

**Build errors**
- Clear `.next/` directory and reinstall: `rm -rf .next node_modules && bun install`
- Ensure Node.js version >= 18.17

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2 (App Router) |
| Backend | Convex 1.34 |
| Canvas | Konva / react-konva |
| UI Components | shadcn/ui (base-nova style, @base-ui/react primitives) |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| Fonts | Geist Sans, Geist Mono |
| Language | TypeScript 5 |
| Package Manager | Bun |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Follow the existing code conventions (see `AGENTS.md` for project patterns)
4. Run linting before committing: `npm run lint`
5. Submit a pull request with a clear description of changes

## License

Private — All rights reserved.
