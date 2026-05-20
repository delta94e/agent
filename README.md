# MAOP — Multi-Agent Orchestration Platform

> Nền tảng điều phối đa tác vụ AI với trực quan hóa 3D thời gian thực.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![Three.js](https://img.shields.io/badge/Three.js-0.170-black?logo=three.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![MUI](https://img.shields.io/badge/MUI-6-007FFF?logo=mui)

---

## Overview

MAOP cho phép setup, trực quan hóa và giám sát mạng lưới AI agents tương tác với nhau theo thời gian thực. Giao diện sử dụng 3D visualization (React Three Fiber) hiển thị Agent Graph với hiệu ứng Bloom, particle streaming, và force-directed layout.

### Highlights

- **3D Agent Graph** — Nodes (AI agents) + Edges (connections) trong không gian 3D
- **Real-time Streaming** — Token flow visualization từ LLM APIs
- **Force-Directed Layout** — Tính toán đa luồng bằng Web Worker
- **60 FPS** — InstancedMesh particles, transient Zustand state
- **Glassmorphism UI** — Control panel floating trên 3D canvas

---

## Documentation

| Doc | Mô Tả |
|-----|--------|
| [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Design tokens, color palette, typography, components, effects |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, threading, state management, data flow |
| [IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) | Phased plan, file structure, database schema |
| [CONVENTIONS.md](docs/CONVENTIONS.md) | Code patterns, CSS rules, Three.js rules, testing |

### Design System Preview

Mở file `design-system-preview.html` để xem live preview tất cả visual components:

```bash
open design-system-preview.html
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| 3D Engine | Three.js + React Three Fiber + drei + postprocessing |
| UI Components | Material UI 6 |
| State | Zustand 5 |
| Layout Algorithm | d3-force-3d (Web Worker) |
| Database | Supabase (PostgreSQL + Realtime) |
| Cache | Upstash (Serverless Redis) |
| LLM APIs | OpenAI / Gemini / Claude |
| Testing | Vitest + Playwright |
| CI/CD | GitHub Actions → Vercel |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# 3. Run development server
npm run dev

# 4. Open browser
open http://localhost:3000
```

---

## Project Structure

```
src/
├── app/              ← Next.js pages + API routes
├── components/
│   ├── canvas/       ← 3D components (R3F)
│   ├── panels/       ← UI panels (MUI)
│   └── ui/           ← Reusable UI components
├── store/            ← Zustand stores
├── workers/          ← Web Workers
├── lib/              ← Backend clients
├── theme/            ← MUI theme + tokens
└── types/            ← TypeScript types
```

---

## AI / Developer Onboarding

Khi mới vào project, đọc theo thứ tự:

1. **README.md** (file này) — overview
2. **docs/DESIGN_SYSTEM.md** — hiểu visual language
3. **docs/ARCHITECTURE.md** — hiểu cách hệ thống hoạt động
4. **docs/CONVENTIONS.md** — hiểu quy tắc coding
5. **docs/IMPLEMENTATION_PLAN.md** — hiểu plan & file structure
6. **design-system-preview.html** — xem live preview

---

## License

Private — All rights reserved.
