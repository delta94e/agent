# MAOP Architecture Reference

> **Mục đích**: Tài liệu này mô tả kiến trúc kỹ thuật toàn diện của MAOP — Multi-Agent Orchestration Platform.  
> Dùng cho developer/AI khi cần hiểu cách hệ thống hoạt động trước khi code.

---

## Mục Lục

1. [Tổng Quan Hệ Thống](#1-tổng-quan-hệ-thống)
2. [Thread Architecture](#2-thread-architecture)
3. [State Management](#3-state-management)
4. [Data Flow](#4-data-flow)
5. [3D Engine Design](#5-3d-engine-design)
6. [Backend Infrastructure](#6-backend-infrastructure)
7. [Performance Strategies](#7-performance-strategies)
8. [Security Considerations](#8-security-considerations)

---

## 1. Tổng Quan Hệ Thống

### Kiến Trúc Hai Lớp (Dual-Layer)

Giao diện chia làm 2 lớp render song song:

```
┌──────────────────────────────────────────────────┐
│                  UI DOM Layer                     │  ← MUI Components
│   ┌────────────┐  ┌─────────────┐  ┌──────────┐ │     (Control Panel, Forms,
│   │ControlPanel│  │ AgentConfig │  │ Metrics  │ │      Logs, Metrics)
│   └────────────┘  └─────────────┘  └──────────┘ │
│                                                   │  ← position: fixed / absolute
│   ● Glass panels float above 3D canvas           │     z-index > canvas
├──────────────────────────────────────────────────┤
│                 3D Canvas Layer                    │  ← React Three Fiber
│                                                   │
│   ◉ Agent Nodes (glowing spheres)                │     WebGL <canvas>
│   ─── Connection Edges (tubes/lines)             │     position: fixed
│   ✦ Particles (InstancedMesh)                    │     z-index: 0
│   ⬡ Post-processing (Bloom)                     │
│                                                   │
└──────────────────────────────────────────────────┘
```

### Tech Stack Map

```
Frontend                        Backend
──────────                      ───────
Next.js 15 (App Router)         Vercel Edge Functions
React 19                        Supabase (PostgreSQL + Realtime)
React Three Fiber 9             Upstash (Serverless Redis)
@react-three/drei 9             LLM APIs (OpenAI / Gemini / Claude)
@react-three/postprocessing 3
Three.js 0.170+
MUI 6
Zustand 5
d3-force-3d 4
Web Workers API

DevTools                        Infrastructure
────────                        ──────────────
TypeScript 5                    Vercel (Hosting)
Vitest 3                        GitHub Actions (CI/CD)
Playwright 1                    Supabase (Database)
ESLint 9                        Upstash (Cache)
```

---

## 2. Thread Architecture

### Ba Thread Chính

```
┌─────────────────────────────────────────────────────────┐
│                      MAIN THREAD                         │
│                                                          │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────────┐ │
│  │ React    │  │ Zustand   │  │ DOM UI (MUI)         │ │
│  │ Reconcile│  │ Store     │  │ Event Handlers       │ │
│  └──────────┘  └─────┬─────┘  └──────────────────────┘ │
│                       │                                   │
│              useFrame reads                               │
│              transient state                              │
│                       │                                   │
│  ┌────────────────────▼──────────────────────────────┐  │
│  │              R3F Renderer                          │  │
│  │  (schedules WebGL draw calls via requestAnimFrame) │  │
│  └────────────────────────────────────────────────────┘  │
└────────────┬─────────────────────────────────────────────┘
             │ postMessage
┌────────────▼─────────────────────────────────────────────┐
│                    WEB WORKER THREAD                       │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │              d3-force-3d                            │  │
│  │  - Force simulation (charge, link, center)         │  │
│  │  - Iterates ~300 ticks at init, then live updates  │  │
│  │  - Posts back: { nodeId: {x,y,z} } positions       │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                GPU / RENDER THREAD                         │
│  (managed by browser, fed by Main Thread's WebGL calls)   │
│                                                           │
│  ┌─────────────┐  ┌───────────────┐  ┌────────────────┐ │
│  │ Vertex      │  │ Fragment      │  │ Post-Processing│ │
│  │ Processing  │  │ Shading       │  │ (Bloom Pass)   │ │
│  └─────────────┘  └───────────────┘  └────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Web Worker Protocol

```typescript
// Main Thread → Worker
type WorkerInput = {
    type: 'init' | 'update' | 'addNode' | 'removeNode' | 'addLink' | 'removeLink';
    nodes?: Array<{ id: string; x?: number; y?: number; z?: number }>;
    links?: Array<{ source: string; target: string }>;
};

// Worker → Main Thread
type WorkerOutput = {
    type: 'positions' | 'tick' | 'settled';
    positions: Record<string, { x: number; y: number; z: number }>;
    alpha?: number;   // simulation "temperature", settles toward 0
};
```

### Tại Sao Cần Web Worker?

d3-force-3d simulation chạy thuật toán N-body (O(n log n) per tick). Với 50 nodes:
- ~300 initialization ticks × ~50 nodes = ~15,000 force calculations
- Nếu chạy trên Main Thread → block rendering → drop FPS
- Worker giữ Main Thread rảnh → canvas giữ 60 FPS

---

## 3. State Management

### Tại Sao Zustand, Không Phải React Context?

```
React Context Problem:
  Context value changes → ALL consumers re-render
  → Canvas component re-renders → ENTIRE 3D scene re-creates
  → Massive frame drops, flickering, memory leaks

Zustand Solution:
  - Components subscribe to specific slices
  - Transient updates (getState/setState) bypass React render cycle
  - useFrame() reads latest state without triggering re-render
```

### Store Architecture

```
┌─────────────────────────────────────────────┐
│                 Zustand Stores               │
│                                              │
│  ┌──────────────────┐  ┌─────────────────┐  │
│  │   agentStore      │  │  uiStore        │  │
│  │                   │  │                 │  │
│  │  agents[]         │  │  selectedAgent  │  │
│  │  connections[]    │  │  panelVisible   │  │
│  │  positions{}      │  │  cameraTarget   │  │
│  │                   │  │  activeTab      │  │
│  │  addAgent()       │  │  theme          │  │
│  │  removeAgent()    │  │                 │  │
│  │  updatePosition() │  │  selectAgent()  │  │
│  │  setStatus()      │  │  togglePanel()  │  │
│  └──────────────────┘  └─────────────────┘  │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │         orchestrationStore            │   │
│  │                                       │   │
│  │  messages[]        tokenCounts{}      │   │
│  │  streamBuffer{}    metrics{}          │   │
│  │  activeStreams[]    logs[]             │   │
│  │                                       │   │
│  │  sendMessage()     pushLog()          │   │
│  │  startStream()     updateMetrics()    │   │
│  │  stopStream()      flushBuffer()      │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Transient State Pattern (Quan Trọng)

Để update vị trí 3D liên tục mà không trigger React re-render:

```typescript
// ❌ SAI — mỗi position update gây re-render
const positions = useAgentStore(state => state.positions);

// ✅ ĐÚNG — đọc transient trong useFrame, không subscribe
function AgentNode({ id }: { id: string }) {
    const meshRef = useRef<THREE.Mesh>(null);
    
    useFrame(() => {
        // getState() đọc trực tiếp, không qua React
        const pos = useAgentStore.getState().positions[id];
        if (meshRef.current && pos) {
            meshRef.current.position.set(pos.x, pos.y, pos.z);
        }
    });
    
    return <mesh ref={meshRef}>...</mesh>;
}
```

### Store Slice Types

```typescript
// src/types/index.ts

interface Agent {
    id: string;
    name: string;
    model: 'gpt-4o' | 'gpt-4-turbo' | 'gemini-2.5-pro' | 'claude-opus-4';
    systemPrompt: string;
    temperature: number;
    maxTokens: number;
    status: 'idle' | 'processing' | 'active' | 'error';
    position: { x: number; y: number; z: number };
    config: Record<string, unknown>;
    createdAt: string;
}

interface Connection {
    id: string;
    sourceAgentId: string;
    targetAgentId: string;
    connectionType: 'message' | 'data' | 'control';
    isActive: boolean;
}

interface Message {
    id: string;
    sourceAgentId: string;
    targetAgentId: string;
    content: string;
    tokensUsed: number;
    timestamp: string;
    metadata: Record<string, unknown>;
}

interface LogEntry {
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    source: string;
    message: string;
}
```

---

## 4. Data Flow

### Real-time Event Flow

```
User clicks "Start Orchestration"
         │
         ▼
┌─ Main Thread ────────────────────────────────────┐
│  1. UI dispatches action via Zustand              │
│  2. API call → POST /api/orchestrate              │
│     (returns ReadableStream)                      │
└──────────────┬────────────────────────────────────┘
               │
               ▼
┌─ Edge Function ──────────────────────────────────┐
│  3. Orchestrator logic starts                     │
│  4. Calls LLM API (OpenAI/Gemini) for Agent A    │
│  5. Streams tokens back via SSE/ReadableStream    │
│  6. Routes Agent A's output → Agent B's input     │
│  7. Calls LLM API for Agent B                     │
│  8. Streams tokens back                           │
│  9. Writes events to Supabase (Realtime)          │
│ 10. Increments token counter in Upstash Redis     │
└──────────────┬────────────────────────────────────┘
               │
               ▼
┌─ Main Thread (receives stream) ──────────────────┐
│ 11. StreamReader processes chunks                 │
│ 12. Zustand → orchestrationStore.pushToken()      │
│ 13. Token stream UI updates (no re-render)        │
│ 14. Supabase Realtime pushes agent status change  │
│ 15. Zustand → agentStore.setStatus('processing')  │
│ 16. R3F → useFrame reads status → triggers:       │
│     - Node glow animation                         │
│     - Particle emission on connection edge         │
│     - Bloom intensity increase                     │
└──────────────────────────────────────────────────┘
```

### Streaming Response Format

```typescript
// API returns Server-Sent Events (SSE)
// Each event is a JSON line:

{ "type": "token", "agentId": "agent_01", "content": "Based on" }
{ "type": "token", "agentId": "agent_01", "content": " your recent" }
{ "type": "status", "agentId": "agent_01", "status": "processing" }
{ "type": "route", "from": "agent_01", "to": "agent_02", "tokens": 347 }
{ "type": "token", "agentId": "agent_02", "content": "I've analyzed" }
{ "type": "metric", "totalTokens": 12847, "latencyMs": 1200 }
{ "type": "status", "agentId": "agent_02", "status": "idle" }
{ "type": "done" }
```

### Supabase Realtime Subscription

```typescript
// Subscribe to agent status changes
const channel = supabase
    .channel('agent-changes')
    .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agents',
    }, (payload) => {
        // Update Zustand store
        useAgentStore.getState().updateFromDB(payload);
    })
    .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
    }, (payload) => {
        // Trigger particle animation on the connection edge
        useOrchestrationStore.getState().onNewMessage(payload.new);
    })
    .subscribe();
```

---

## 5. 3D Engine Design

### Scene Graph

```
<Canvas>
├── <SceneEnvironment>
│   ├── <ambientLight>
│   ├── <pointLight> (per active node)
│   └── <OrbitControls>
│
├── <AgentGraph>
│   ├── <AgentNode id="1"> (mesh + glow + label)
│   ├── <AgentNode id="2">
│   ├── <AgentNode id="3">
│   ├── <ConnectionEdge from="1" to="2">
│   ├── <ConnectionEdge from="1" to="3">
│   └── <ParticleSystem>  (single InstancedMesh)
│
└── <EffectComposer>
    └── <Bloom intensity={1.5}>
```

### AgentNode Component

```tsx
function AgentNode({ id, color }: { id: string; color: string }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    
    // Read position from Zustand WITHOUT re-render
    useFrame((state, delta) => {
        const pos = useAgentStore.getState().positions[id];
        const status = useAgentStore.getState().agents.find(a => a.id === id)?.status;
        
        if (meshRef.current && pos) {
            // Smooth lerp to target position
            meshRef.current.position.lerp(
                new THREE.Vector3(pos.x, pos.y, pos.z),
                delta * 5
            );
        }
        
        // Pulse glow when processing
        if (glowRef.current && status === 'processing') {
            glowRef.current.scale.setScalar(
                1 + Math.sin(state.clock.elapsedTime * 3) * 0.15
            );
        }
    });
    
    return (
        <group>
            {/* Core sphere */}
            <mesh ref={meshRef} onClick={() => selectAgent(id)}>
                <sphereGeometry args={[0.5, 32, 32]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.5}
                />
            </mesh>
            
            {/* Glow sphere (larger, transparent) */}
            <mesh ref={glowRef}>
                <sphereGeometry args={[0.7, 16, 16]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.15}
                />
            </mesh>
            
            {/* HTML label overlay */}
            <Html position={[0, 1, 0]} center>
                <div className="agent-label">Agent Name</div>
            </Html>
        </group>
    );
}
```

### InstancedMesh cho Particles

```tsx
function ParticleSystem({ count = 10000 }) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const particles = useRef<ParticleData[]>([]);
    
    useFrame((state) => {
        const mesh = meshRef.current;
        if (!mesh) return;
        
        for (let i = 0; i < particles.current.length; i++) {
            const p = particles.current[i];
            
            // Update position along connection path
            p.progress += p.speed;
            if (p.progress > 1) p.progress = 0;
            
            // Lerp between source and target positions
            const pos = lerpPath(p.sourcePath, p.targetPath, p.progress);
            
            dummy.position.set(pos.x, pos.y, pos.z);
            dummy.scale.setScalar(p.size);
            dummy.updateMatrix();
            
            mesh.setMatrixAt(i, dummy.matrix);
            mesh.setColorAt(i, p.color);
        }
        
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
    
    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
    );
}

// 10,000 particles = 1 draw call ✅
```

### Memory Leak Prevention

```typescript
// CRITICAL: Dispose geometry + material when agent removed

function AgentNode({ id }) {
    const geoRef = useRef<THREE.SphereGeometry>();
    const matRef = useRef<THREE.MeshStandardMaterial>();
    
    useEffect(() => {
        return () => {
            // Cleanup on unmount
            geoRef.current?.dispose();
            matRef.current?.dispose();
            
            // If using textures
            matRef.current?.map?.dispose();
            matRef.current?.normalMap?.dispose();
            matRef.current?.emissiveMap?.dispose();
        };
    }, []);
    
    return (
        <mesh>
            <sphereGeometry ref={geoRef} args={[0.5, 32, 32]} />
            <meshStandardMaterial ref={matRef} color="#00f5ff" />
        </mesh>
    );
}
```

---

## 6. Backend Infrastructure

### API Routes

```
POST /api/orchestrate      → Start agent orchestration (streaming response)
GET  /api/agents            → List all agents
POST /api/agents            → Create new agent
PUT  /api/agents/[id]       → Update agent config
DELETE /api/agents/[id]     → Delete agent

GET  /api/metrics           → Get current metrics from Upstash
GET  /api/logs              → Get recent logs
```

### Database Schema (Supabase PostgreSQL)

```sql
-- Core tables
agents              → Agent configurations + status
connections         → Relationships between agents
messages            → Communication log (realtime-enabled)

-- Realtime-enabled tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE agents;
```

### Caching Strategy (Upstash Redis)

```
Key Pattern                     TTL      Purpose
──────────                      ───      ───────
agent:{id}:status               60s      Current agent status cache
metrics:tokens:total            none     Atomic counter for total tokens
metrics:tokens:rate:{minute}    120s     Per-minute token rate
logs:buffer                     none     List — buffered logs before DB write
session:{id}:state              3600s    Session state snapshot
```

### Batch Write Pattern

```typescript
// Logs come in fast (100s per second during orchestration)
// Buffer in Redis → batch write to Supabase every 5 seconds

async function flushLogBuffer() {
    const logs = await redis.lrange('logs:buffer', 0, -1);
    if (logs.length === 0) return;
    
    // Batch insert
    await supabase.from('logs').insert(logs.map(JSON.parse));
    
    // Clear buffer
    await redis.ltrim('logs:buffer', logs.length, -1);
}

// Run every 5 seconds
setInterval(flushLogBuffer, 5000);
```

---

## 7. Performance Strategies

### FPS Budget

| Component | Target | Strategy |
|-----------|--------|----------|
| 3D Canvas | 60 FPS | Transient state, InstancedMesh, LOD |
| UI Panels | 60 FPS | CSS transitions (not JS), virtualized lists |
| Force Layout | Non-blocking | Web Worker |
| Token Stream | 30+ updates/s | requestAnimationFrame batching |

### Performance Optimizations

```
1. InstancedMesh
   - 10,000 particles → 1 draw call (vs 10,000 draw calls)
   - Update matrices in useFrame batch

2. Transient Zustand
   - Position updates bypass React reconciler
   - Only UI-changing state triggers re-renders

3. Web Worker Force Layout
   - O(n log n) simulation off main thread
   - Only sends final positions back

4. React.memo + useMemo
   - Agent cards memoized by id
   - Geometry/material instances shared via useMemo

5. Virtualized Lists
   - Log viewer renders only visible rows
   - Uses @tanstack/react-virtual or similar

6. Level of Detail (LOD)
   - Far nodes render as simple points
   - Near nodes render full geometry
   - Particles reduce count when camera zooms out

7. Bloom Selective
   - Only emissive materials trigger bloom
   - luminanceThreshold filters non-glowing objects
```

### Memory Management Checklist

```
When adding agent:
  ✅ Create geometry + material
  ✅ Register in Zustand store
  ✅ Add to force simulation (worker)

When removing agent:
  ✅ geometry.dispose()
  ✅ material.dispose()
  ✅ texture.dispose() (if any)
  ✅ Remove from Zustand store
  ✅ Remove from force simulation (worker)
  ✅ Unsubscribe Supabase channel (if dedicated)
  ✅ Clean up particles associated with connections
```

---

## 8. Security Considerations

### API Key Management

```
NEVER expose API keys in client code.

✅ Store in environment variables (.env.local)
✅ Access only from API routes (server-side)
✅ Use Vercel environment variables for production

NEXT_PUBLIC_SUPABASE_URL=...        ← OK (public)
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   ← OK (public, RLS-protected)
SUPABASE_SERVICE_ROLE_KEY=...       ← SERVER ONLY
OPENAI_API_KEY=...                  ← SERVER ONLY
UPSTASH_REDIS_REST_URL=...          ← SERVER ONLY
UPSTASH_REDIS_REST_TOKEN=...        ← SERVER ONLY
```

### Input Validation

```typescript
// Validate all user inputs with Zod before DB write
import { z } from 'zod';

const AgentSchema = z.object({
    name: z.string().min(1).max(100),
    model: z.enum(['gpt-4o', 'gpt-4-turbo', 'gemini-2.5-pro', 'claude-opus-4']),
    systemPrompt: z.string().max(10000).optional(),
    temperature: z.number().min(0).max(2),
    maxTokens: z.number().int().min(1).max(128000),
});
```

### Rate Limiting

```typescript
// Use Upstash Rate Limit for API routes
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '10 s'),  // 10 requests per 10 seconds
});
```
