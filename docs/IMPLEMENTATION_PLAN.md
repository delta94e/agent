# MAOP Implementation Plan

> **Version**: 1.0  
> **Status**: Awaiting Approval  
> **Estimated Phases**: 7 phases

---

## Mục Lục

1. [Project Setup](#phase-1-project-setup--design-system)
2. [State Management](#phase-2-state-management--data-layer)
3. [3D Engine Core](#phase-3-3d-engine-core)
4. [3D Interactions](#phase-4-3d-interactions--particles)
5. [UI Control Panel](#phase-5-ui-control-panel)
6. [Backend Integration](#phase-6-backend-integration)
7. [Testing & CI/CD](#phase-7-testing--cicd)
8. [Dependencies](#dependencies)
9. [File Structure](#file-structure)
10. [Database Schema](#database-schema)
11. [Environment Variables](#environment-variables)

---

## Phase 1: Project Setup & Design System

### 1.1 Initialize Next.js Project

```bash
npx -y create-next-app@latest ./ \
    --typescript \
    --eslint \
    --app \
    --src-dir \
    --import-alias "@/*" \
    --no-tailwind
```

### 1.2 Install Dependencies

```bash
# 3D Engine
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing
npm install -D @types/three

# UI
npm install @mui/material @emotion/react @emotion/styled

# State
npm install zustand

# Layout Algorithm
npm install d3-force-3d

# Backend
npm install @supabase/supabase-js @upstash/redis zod

# Dev Tools
npm install -D vitest @playwright/test
```

### 1.3 Files to Create

| File | Mô Tả |
|------|--------|
| `src/app/globals.css` | CSS Custom Properties (tất cả design tokens), reset, utilities, keyframes |
| `src/theme/theme.ts` | MUI Theme Provider config — dark mode, palette, typography, component overrides |
| `src/theme/tokens.ts` | TypeScript constants cho design tokens (dùng trong Three.js và JS logic) |
| `next.config.js` | Config: transpile Three.js packages, webpack config cho Web Workers |

### 1.4 Acceptance Criteria

- [ ] `npm run dev` chạy không lỗi
- [ ] Page hiển thị đúng dark background (#0a0a0f)
- [ ] Google Fonts load đúng (Orbitron, Inter, JetBrains Mono)
- [ ] MUI ThemeProvider wrap app, components render đúng palette

---

## Phase 2: State Management & Data Layer

### 2.1 Files to Create

| File | Mô Tả |
|------|--------|
| `src/types/index.ts` | TypeScript interfaces: Agent, Connection, Message, LogEntry, etc. |
| `src/store/agentStore.ts` | Zustand store: agents[], connections[], positions{}, CRUD actions |
| `src/store/orchestrationStore.ts` | Zustand store: messages[], streams[], tokenCounts, logs[] |
| `src/store/uiStore.ts` | Zustand store: selectedAgent, panelState, cameraTarget, theme |

### 2.2 Store Design Principles

1. **agentStore** — source of truth cho agent data
   - `agents[]` — danh sách agents
   - `connections[]` — kết nối giữa agents
   - `positions{}` — Record<agentId, {x,y,z}> — updated by Web Worker
   - Actions: `addAgent()`, `removeAgent()`, `updateAgent()`, `updatePosition()`, `setStatus()`

2. **orchestrationStore** — streaming & runtime data
   - `streamBuffers{}` — token chunks đang stream per agent
   - `messages[]` — message history
   - `metrics{}` — token counts, latency, throughput
   - `logs[]` — system log entries (capped at 500)
   - Actions: `pushToken()`, `sendMessage()`, `pushLog()`, `updateMetrics()`

3. **uiStore** — UI-only state
   - `selectedAgentId` — agent đang được chọn
   - `isPanelOpen` — control panel visibility
   - `activeTab` — tab hiện tại trong control panel
   - `cameraPosition` — target camera position
   - Actions: `selectAgent()`, `togglePanel()`, `setTab()`, `setCameraTarget()`

### 2.3 Acceptance Criteria

- [ ] Stores khởi tạo với mock data (3–5 agents)
- [ ] Có thể add/remove agent qua store actions
- [ ] `getState()` trả về data đúng type
- [ ] Unit tests pass cho tất cả store actions

---

## Phase 3: 3D Engine Core

### 3.1 Files to Create

| File | Mô Tả |
|------|--------|
| `src/components/canvas/AgentGraph.tsx` | Main R3F `<Canvas>` wrapper, scene setup, post-processing |
| `src/components/canvas/SceneEnvironment.tsx` | Lighting, ambient, OrbitControls |
| `src/components/canvas/AgentNode.tsx` | 3D mesh cho mỗi agent (sphere + glow + label) |
| `src/components/canvas/ConnectionEdge.tsx` | 3D line/tube giữa 2 agents |
| `src/workers/forceLayout.worker.ts` | Web Worker chạy d3-force-3d |

### 3.2 AgentGraph (Canvas Wrapper)

```tsx
// Layout: Canvas chiếm full viewport, fixed position
<div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
    <Canvas camera={{ position: [0, 0, 30], fov: 60 }}>
        <SceneEnvironment />
        {agents.map(agent => (
            <AgentNode key={agent.id} id={agent.id} />
        ))}
        {connections.map(conn => (
            <ConnectionEdge key={conn.id} connection={conn} />
        ))}
        <ParticleSystem />
        <EffectComposer>
            <Bloom intensity={1.5} luminanceThreshold={0.2} />
        </EffectComposer>
    </Canvas>
</div>
```

### 3.3 Web Worker Integration

```
Init Flow:
1. AgentGraph mounts → create Worker
2. Send init message: { type: 'init', nodes, links }
3. Worker runs d3-force-3d simulation (~300 ticks)
4. Worker posts back positions: { type: 'positions', data }
5. Main thread → zustand.updatePosition(data)
6. useFrame → reads positions → updates mesh.position

Update Flow:
1. User adds agent → store.addAgent()
2. Send to worker: { type: 'addNode', node }
3. Worker re-simulates → posts new positions
4. Nodes animate to new positions (lerp in useFrame)
```

### 3.4 Acceptance Criteria

- [ ] Canvas render 3–5 agent nodes từ mock data
- [ ] Nodes tự động layout bằng force-directed (Web Worker)
- [ ] OrbitControls: rotate, zoom, pan hoạt động
- [ ] Bloom effect hiển thị trên emissive nodes
- [ ] Connection edges hiển thị giữa connected agents
- [ ] FPS >= 55 với 5 nodes

---

## Phase 4: 3D Interactions & Particles

### 4.1 Files to Create

| File | Mô Tả |
|------|--------|
| `src/components/canvas/ParticleSystem.tsx` | InstancedMesh particle rendering |
| Update `AgentNode.tsx` | Thêm click handler, hover glow, status animation |
| Update `ConnectionEdge.tsx` | Thêm particle flow animation khi data streaming |

### 4.2 Interaction Design

```
Click on Node → selectAgent(id) → UI panel shows agent details
Hover on Node → scale up 1.1x, glow intensify
Active Node → pulsing glow, emissive intensity oscillates
Streaming → particles flow along connection edge (source → target)
Error Node → red glow, particles stop
```

### 4.3 InstancedMesh Particles

- Mỗi active connection sinh particles
- Particles di chuyển dọc theo edge (lerp progress 0→1)
- Sử dụng 1 InstancedMesh cho tất cả particles
- Update `setMatrixAt()` + `setColorAt()` mỗi frame
- Particle count tỷ lệ với token throughput

### 4.4 Acceptance Criteria

- [ ] Click node → select trong UI
- [ ] Hover node → visual feedback
- [ ] Active node → pulse animation
- [ ] Particles chạy dọc connection khi simulating
- [ ] 10,000 particles giữ 60 FPS (1 draw call)

---

## Phase 5: UI Control Panel

### 5.1 Files to Create

| File | Mô Tả |
|------|--------|
| `src/components/panels/ControlPanel.tsx` | Main panel container, glassmorphism, tabs |
| `src/components/panels/AgentConfigForm.tsx` | Form tạo/edit agent (Zod validation) |
| `src/components/panels/AgentList.tsx` | Danh sách agents với status badges |
| `src/components/panels/MetricsDashboard.tsx` | Real-time charts, token counters |
| `src/components/panels/LogViewer.tsx` | Virtualized log list |
| `src/components/ui/GlassCard.tsx` | Reusable glassmorphism card |
| `src/components/ui/GlowButton.tsx` | Styled button with glow |
| `src/components/ui/StatusBadge.tsx` | Agent status indicator |
| `src/components/ui/CustomSelect.tsx` | Custom dropdown (không dùng native select) |
| `src/components/ui/TokenCounter.tsx` | Animated token count display |

### 5.2 Control Panel Layout

```
┌─────────────────────────────┐
│ MAOP Control Panel    [×]   │  ← Fixed right side, glassmorphism
├─────────────────────────────┤
│ [Agents] [Workflows] [···]  │  ← Tab navigation
├─────────────────────────────┤
│                              │
│  Agent List / Config Form    │  ← Tab content
│  Metrics Dashboard           │
│  Log Viewer                  │
│                              │
├─────────────────────────────┤
│ + Add Agent    ▶ Start       │  ← Action buttons
└─────────────────────────────┘

Position: fixed
Right: 0, Top: 0, Bottom: 0
Width: 420px (desktop) / full-width (mobile)
z-index: 10 (above canvas)
```

### 5.3 Acceptance Criteria

- [ ] Panel mở/đóng mượt (slide animation)
- [ ] Tab navigation hoạt động
- [ ] Form validation hiển thị lỗi
- [ ] Agent list cập nhật real-time khi store thay đổi
- [ ] Log viewer auto-scroll, virtualized (1000+ entries không lag)
- [ ] Custom dropdown hoạt động đúng
- [ ] Responsive: collapse trên mobile

---

## Phase 6: Backend Integration

### 6.1 Files to Create

| File | Mô Tả |
|------|--------|
| `src/lib/supabase.ts` | Supabase client init + helpers |
| `src/lib/upstash.ts` | Upstash Redis client + token counter |
| `src/lib/llm.ts` | LLM API wrapper (OpenAI/Gemini) |
| `src/app/api/orchestrate/route.ts` | Edge function — orchestration engine |
| `src/app/api/agents/route.ts` | CRUD API cho agents |
| `src/app/api/agents/[id]/route.ts` | Single agent operations |
| `src/app/api/metrics/route.ts` | Metrics endpoint |

### 6.2 Orchestration Engine

```typescript
// POST /api/orchestrate
// Receives: { agentIds: string[], workflow: WorkflowConfig }
// Returns: ReadableStream (SSE)

export async function POST(req: Request) {
    const { agentIds, workflow } = await req.json();
    
    const stream = new ReadableStream({
        async start(controller) {
            for (const step of workflow.steps) {
                const agent = await getAgent(step.agentId);
                const llmStream = await callLLM(agent, step.input);
                
                for await (const chunk of llmStream) {
                    controller.enqueue(
                        encoder.encode(JSON.stringify({
                            type: 'token',
                            agentId: agent.id,
                            content: chunk,
                        }) + '\n')
                    );
                    
                    // Track token usage in Redis
                    await redis.incr(`metrics:tokens:total`);
                }
                
                // Route output to next agent
                // ...
            }
            
            controller.close();
        }
    });
    
    return new Response(stream, {
        headers: { 'Content-Type': 'text/event-stream' },
    });
}
```

### 6.3 Fallback Strategy (No API Keys)

Khi chưa có API keys, hệ thống sử dụng mock data:

```typescript
// src/lib/llm.ts
export async function callLLM(agent: Agent, input: string) {
    if (!process.env.OPENAI_API_KEY) {
        return mockLLMStream(agent, input); // Returns fake streaming tokens
    }
    return realLLMStream(agent, input);
}
```

### 6.4 Acceptance Criteria

- [ ] API routes respond đúng format
- [ ] Streaming response hiển thị real-time trên UI
- [ ] Token counter tăng khi stream
- [ ] Supabase realtime push events lên UI
- [ ] Fallback mock data hoạt động khi không có API keys

---

## Phase 7: Testing & CI/CD

### 7.1 Files to Create

| File | Mô Tả |
|------|--------|
| `vitest.config.ts` | Vitest configuration |
| `playwright.config.ts` | Playwright configuration |
| `src/__tests__/forceLayout.test.ts` | Unit test cho thuật toán layout |
| `src/__tests__/agentStore.test.ts` | Unit test cho Zustand store |
| `src/__tests__/tokenCounter.test.ts` | Unit test cho token counting logic |
| `e2e/canvas-regression.spec.ts` | Visual regression cho 3D canvas |
| `.github/workflows/ci.yml` | GitHub Actions pipeline |

### 7.2 Test Strategy

```
Unit Tests (Vitest)
├── Store logic (agentStore, orchestrationStore)
├── Force layout calculations (worker logic, no DOM)
├── Token counting and metrics aggregation
├── Zod validation schemas
└── Utility functions

Visual Regression (Playwright)
├── Screenshot canvas at default camera angle
├── Screenshot with 5 agents loaded
├── Screenshot with bloom effects
└── Compare against baseline images

E2E (Playwright)
├── Add agent via form → appears in 3D
├── Delete agent → removed from 3D
├── Start orchestration → particles animate
└── Control panel interactions
```

### 7.3 CI Pipeline

```yaml
name: CI
on: [push, pull_request]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx tsc --noEmit          # Type check
      - run: npm run lint               # ESLint
      - run: npm run test               # Vitest
      - run: npm run build              # Build check
      
  visual-regression:
    runs-on: ubuntu-latest
    needs: lint-and-test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
```

### 7.4 Acceptance Criteria

- [ ] `npm run test` passes all unit tests
- [ ] `npx tsc --noEmit` — no type errors
- [ ] `npm run lint` — no warnings
- [ ] `npm run build` — builds successfully
- [ ] Playwright screenshots match baselines
- [ ] GitHub Actions pipeline green

---

## Dependencies

### Production

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | `^15` | App framework |
| `react` / `react-dom` | `^19` | UI library |
| `three` | `^0.170` | 3D engine |
| `@react-three/fiber` | `^9` | React ↔ Three.js bridge |
| `@react-three/drei` | `^9` | R3F utilities (OrbitControls, Html, etc.) |
| `@react-three/postprocessing` | `^3` | Post-processing effects (Bloom) |
| `@mui/material` | `^6` | UI component library |
| `@emotion/react` | `^11` | CSS-in-JS (MUI dependency) |
| `@emotion/styled` | `^11` | Styled components (MUI dependency) |
| `zustand` | `^5` | State management |
| `d3-force-3d` | `^4` | 3D force-directed layout algorithm |
| `@supabase/supabase-js` | `^2` | Database client |
| `@upstash/redis` | `^1` | Serverless Redis |
| `@upstash/ratelimit` | `^2` | API rate limiting |
| `zod` | `^3` | Runtime validation |

### Development

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | `^5` | Type safety |
| `@types/three` | `*` | Three.js types |
| `vitest` | `^3` | Unit testing |
| `@playwright/test` | `^1` | E2E + visual regression |
| `eslint` | `^9` | Linting |

---

## File Structure

```
agent/
├── docs/
│   ├── DESIGN_SYSTEM.md         ← Design system reference
│   ├── ARCHITECTURE.md          ← Architecture reference
│   ├── IMPLEMENTATION_PLAN.md   ← This file
│   └── CONVENTIONS.md           ← Code conventions
├── design-system-preview.html   ← Live preview of design system
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── public/
│   └── fonts/                   ← Self-hosted fallback fonts
│
├── src/
│   ├── app/
│   │   ├── layout.tsx           ← Root layout + providers
│   │   ├── page.tsx             ← Main page (Canvas + Panels)
│   │   ├── globals.css          ← Design tokens + base styles
│   │   └── api/
│   │       ├── orchestrate/
│   │       │   └── route.ts     ← Streaming orchestration API
│   │       ├── agents/
│   │       │   ├── route.ts     ← List + Create agents
│   │       │   └── [id]/
│   │       │       └── route.ts ← Get + Update + Delete agent
│   │       └── metrics/
│   │           └── route.ts     ← Metrics endpoint
│   │
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── AgentGraph.tsx       ← Canvas wrapper + scene
│   │   │   ├── SceneEnvironment.tsx ← Lights + controls
│   │   │   ├── AgentNode.tsx        ← 3D agent sphere
│   │   │   ├── ConnectionEdge.tsx   ← 3D connection line
│   │   │   └── ParticleSystem.tsx   ← InstancedMesh particles
│   │   │
│   │   ├── panels/
│   │   │   ├── ControlPanel.tsx     ← Main panel container
│   │   │   ├── AgentConfigForm.tsx  ← Agent create/edit form
│   │   │   ├── AgentList.tsx        ← Agent list with status
│   │   │   ├── MetricsDashboard.tsx ← Real-time metrics
│   │   │   └── LogViewer.tsx        ← Virtualized log viewer
│   │   │
│   │   └── ui/
│   │       ├── GlassCard.tsx        ← Glassmorphism container
│   │       ├── GlowButton.tsx       ← Button with glow
│   │       ├── StatusBadge.tsx      ← Status indicator
│   │       ├── CustomSelect.tsx     ← Custom dropdown
│   │       └── TokenCounter.tsx     ← Animated counter
│   │
│   ├── store/
│   │   ├── agentStore.ts        ← Agent + connection state
│   │   ├── orchestrationStore.ts ← Stream + metrics state
│   │   └── uiStore.ts           ← UI state
│   │
│   ├── workers/
│   │   └── forceLayout.worker.ts ← d3-force-3d Web Worker
│   │
│   ├── lib/
│   │   ├── supabase.ts          ← Supabase client
│   │   ├── upstash.ts           ← Redis client
│   │   ├── llm.ts               ← LLM API wrapper
│   │   └── utils.ts             ← Shared utilities
│   │
│   ├── theme/
│   │   ├── theme.ts             ← MUI theme config
│   │   └── tokens.ts            ← JS design tokens
│   │
│   ├── types/
│   │   └── index.ts             ← TypeScript interfaces
│   │
│   └── __tests__/
│       ├── forceLayout.test.ts
│       ├── agentStore.test.ts
│       └── tokenCounter.test.ts
│
├── e2e/
│   └── canvas-regression.spec.ts
│
├── .env.local                   ← Environment variables (git-ignored)
├── .env.example                 ← Template for env vars
├── next.config.js
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

---

## Database Schema

```sql
-- ===== AGENTS =====
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    model TEXT NOT NULL DEFAULT 'gpt-4o',
    system_prompt TEXT,
    temperature FLOAT DEFAULT 0.7,
    max_tokens INT DEFAULT 2048,
    status TEXT DEFAULT 'idle'
        CHECK (status IN ('idle', 'processing', 'active', 'error')),
    position JSONB DEFAULT '{"x":0,"y":0,"z":0}',
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== CONNECTIONS =====
CREATE TABLE connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    target_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    connection_type TEXT DEFAULT 'message'
        CHECK (connection_type IN ('message', 'data', 'control')),
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(source_agent_id, target_agent_id)
);

-- ===== MESSAGES =====
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    target_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    content TEXT,
    tokens_used INT DEFAULT 0,
    latency_ms INT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for message queries
CREATE INDEX idx_messages_created_at ON messages (created_at DESC);
CREATE INDEX idx_messages_source ON messages (source_agent_id);
CREATE INDEX idx_messages_target ON messages (target_agent_id);

-- ===== REALTIME =====
ALTER PUBLICATION supabase_realtime ADD TABLE agents;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ===== AUTO-UPDATE updated_at =====
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

---

## Environment Variables

```bash
# .env.example

# === Supabase ===
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# === Upstash Redis ===
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...

# === LLM APIs (at least one required) ===
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=AI...
ANTHROPIC_API_KEY=sk-ant-...

# === App Config ===
NEXT_PUBLIC_APP_URL=http://localhost:3000
MAX_AGENTS=50
MAX_TOKENS_PER_SESSION=100000
```
