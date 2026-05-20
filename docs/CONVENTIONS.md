# MAOP Code Conventions

> **Mục đích**: Quy tắc coding cho toàn bộ dự án. Đọc file này trước khi viết code.

---

## 1. General Rules

### Ngôn Ngữ

- Code: **English** (variable names, function names, comments)
- UI text: **English** (nhưng docs có thể Vietnamese)
- Commit messages: **English**, conventional commits format

### File Naming

```
Components:     PascalCase.tsx        (AgentNode.tsx, ControlPanel.tsx)
Hooks:          camelCase.ts          (useAgentStore.ts)
Utilities:      camelCase.ts          (utils.ts, formatters.ts)
Types:          PascalCase or index   (index.ts trong types/)
Stores:         camelCase.ts          (agentStore.ts)
Workers:        camelCase.worker.ts   (forceLayout.worker.ts)
CSS Modules:    ComponentName.module.css
Tests:          originalName.test.ts
E2E:            descriptive-name.spec.ts
```

### Exports

```typescript
// ✅ Named exports cho components và utilities
export function AgentNode() { ... }
export const useAgentStore = create<AgentStore>((set) => { ... });

// ❌ Tránh default exports (trừ Next.js pages)
export default function AgentNode() { ... }

// ✅ Default export CHỈ cho Next.js page components
// src/app/page.tsx
export default function HomePage() { ... }
```

---

## 2. React Patterns

### Component Structure

```tsx
// 1. Imports (grouped: react, third-party, internal, styles)
import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAgentStore } from '@/store/agentStore';
import styles from './AgentNode.module.css';

// 2. Types (co-located or from types/)
interface AgentNodeProps {
    id: string;
    color?: string;
}

// 3. Component
export function AgentNode({ id, color = '#00f5ff' }: AgentNodeProps) {
    // 3a. Refs
    const meshRef = useRef<THREE.Mesh>(null);
    
    // 3b. Store subscriptions (specific slices only)
    const agentName = useAgentStore(state => 
        state.agents.find(a => a.id === id)?.name
    );
    
    // 3c. Derived values
    const threeColor = useMemo(() => new THREE.Color(color), [color]);
    
    // 3d. Effects
    useEffect(() => {
        return () => {
            // Cleanup
        };
    }, []);
    
    // 3e. Handlers
    const handleClick = () => { ... };
    
    // 3f. Render
    return (
        <mesh ref={meshRef} onClick={handleClick}>
            ...
        </mesh>
    );
}
```

### Zustand Store Pattern

```typescript
import { create } from 'zustand';

interface AgentStore {
    // State
    agents: Agent[];
    positions: Record<string, Position3D>;
    
    // Actions
    addAgent: (agent: Agent) => void;
    removeAgent: (id: string) => void;
    updatePosition: (id: string, pos: Position3D) => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
    // Initial state
    agents: [],
    positions: {},
    
    // Actions use set() for reactive updates
    addAgent: (agent) => set(state => ({
        agents: [...state.agents, agent],
    })),
    
    removeAgent: (id) => set(state => ({
        agents: state.agents.filter(a => a.id !== id),
        positions: Object.fromEntries(
            Object.entries(state.positions).filter(([key]) => key !== id)
        ),
    })),
    
    // Position updates — high frequency, called from Worker
    // UI components should NOT subscribe to positions
    // Use getState() in useFrame instead
    updatePosition: (id, pos) => set(state => ({
        positions: { ...state.positions, [id]: pos },
    })),
}));
```

### Transient State (3D Performance Critical)

```typescript
// ✅ ĐÚNG — đọc position trong useFrame, không subscribe
useFrame(() => {
    const pos = useAgentStore.getState().positions[id];
    if (meshRef.current && pos) {
        meshRef.current.position.set(pos.x, pos.y, pos.z);
    }
});

// ❌ SAI — subscribe positions gây re-render mỗi frame
const positions = useAgentStore(state => state.positions);
```

---

## 3. CSS Rules

### Token Usage

```css
/* LUÔN dùng CSS custom properties */
.card {
    background: var(--color-bg-glass);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    transition: all var(--duration-normal) var(--ease-out-expo);
}

/* KHÔNG hardcode giá trị */
.card {
    background: rgba(26, 26, 46, 0.65);  /* ❌ */
    border-radius: 16px;                   /* ❌ */
}
```

### Glassmorphism Pattern

Khi tạo panel/card mới, luôn dùng pattern này:

```css
.my-panel {
    background: var(--color-bg-glass);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);  /* Safari support */
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
}
```

### Hover Pattern

Mọi interactive element cần có hover state:

```css
.interactive:hover {
    border-color: var(--color-border-strong);
    box-shadow: var(--glow-cyan);
    transform: translateY(-2px);
    transition: all var(--duration-normal) var(--ease-out-expo);
}
```

### Font Assignment

```
Headings, Agent names, Stat values     → var(--font-display)
Body text, Descriptions, Labels         → var(--font-body)
Code, Logs, Timestamps, Badge text      → var(--font-mono)
```

### Native Elements — KHÔNG dùng

```html
<!-- ❌ KHÔNG dùng native select -->
<select>...</select>

<!-- ✅ Dùng custom dropdown component -->
<CustomSelect options={[...]} />

<!-- ❌ KHÔNG dùng native scrollbar (đã override trong globals.css) -->
<!-- ✅ Custom scrollbar đã được set sẵn -->
```

---

## 4. Three.js Rules

### Memory Management

```typescript
// MỌI component 3D phải dispose khi unmount
useEffect(() => {
    return () => {
        geometryRef.current?.dispose();
        materialRef.current?.dispose();
        textureRef.current?.dispose();
    };
}, []);
```

### InstancedMesh cho Nhiều Object Giống Nhau

```typescript
// Khi cần render > 100 objects giống nhau → InstancedMesh
// KHÔNG tạo 100 <mesh> components

// ✅ 1 InstancedMesh, 10000 instances = 1 draw call
<instancedMesh args={[geometry, material, 10000]} />

// ❌ 10000 mesh components = 10000 draw calls
{Array(10000).map(i => <mesh key={i} />)}
```

### useFrame Rules

```typescript
useFrame((state, delta) => {
    // ✅ Chỉ dùng cho visual updates (position, rotation, scale, color)
    // ✅ Đọc state qua getState() — KHÔNG subscribe
    // ❌ KHÔNG gọi API, setState, hoặc heavy computation ở đây
    // ❌ KHÔNG tạo new objects mỗi frame (gây GC pressure)
    
    // ✅ Pre-allocate objects
    const tempVec = useMemo(() => new THREE.Vector3(), []);
    
    // ❌ Tạo mới mỗi frame
    mesh.position.copy(new THREE.Vector3(x, y, z)); // BAD
});
```

### Bloom Integration

```typescript
// Chỉ objects có emissive material mới trigger Bloom
<meshStandardMaterial 
    emissive="#00f5ff"
    emissiveIntensity={0.5}  // Controls bloom brightness
/>

// Objects không cần bloom:
<meshBasicMaterial color="#1a1a2e" />  // Won't bloom
```

---

## 5. TypeScript Rules

### Strict Types

```typescript
// ✅ Interface cho props
interface AgentNodeProps {
    id: string;
    color?: string;
    onSelect?: (id: string) => void;
}

// ✅ Enums hoặc union types cho fixed values
type AgentStatus = 'idle' | 'processing' | 'active' | 'error';
type ConnectionType = 'message' | 'data' | 'control';
type LLMModel = 'gpt-4o' | 'gpt-4-turbo' | 'gemini-2.5-pro' | 'claude-opus-4';

// ❌ Tránh any
const data: any = response;  // BAD

// ✅ Dùng unknown + type guard
const data: unknown = response;
if (isAgent(data)) { ... }
```

### Zod Validation

```typescript
// Validate ALL user inputs before processing
import { z } from 'zod';

const AgentSchema = z.object({
    name: z.string().min(1).max(100),
    model: z.enum(['gpt-4o', 'gpt-4-turbo', 'gemini-2.5-pro', 'claude-opus-4']),
    temperature: z.number().min(0).max(2),
    maxTokens: z.number().int().min(1).max(128000),
});

// In API route:
const result = AgentSchema.safeParse(body);
if (!result.success) {
    return Response.json({ error: result.error.flatten() }, { status: 400 });
}
```

---

## 6. API Route Rules

### Naming

```
GET    /api/agents          → List
POST   /api/agents          → Create
GET    /api/agents/[id]     → Get one
PUT    /api/agents/[id]     → Update
DELETE /api/agents/[id]     → Delete
POST   /api/orchestrate     → Start orchestration
```

### Response Format

```typescript
// Success
return Response.json({ data: result }, { status: 200 });

// Created
return Response.json({ data: newAgent }, { status: 201 });

// Error
return Response.json({ error: 'Not found' }, { status: 404 });

// Streaming
return new Response(stream, {
    headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
    },
});
```

### Error Handling

```typescript
export async function GET(req: Request) {
    try {
        const data = await fetchData();
        return Response.json({ data });
    } catch (error) {
        console.error('[API] Error:', error);
        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
```

---

## 7. Testing Rules

### Unit Tests (Vitest)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('agentStore', () => {
    beforeEach(() => {
        // Reset store before each test
        useAgentStore.setState({ agents: [], positions: {} });
    });
    
    it('should add agent', () => {
        const agent = createMockAgent();
        useAgentStore.getState().addAgent(agent);
        expect(useAgentStore.getState().agents).toHaveLength(1);
    });
});
```

### What to Test

```
✅ Test:
- Store actions (add, remove, update)
- Pure functions (formatters, calculators, validators)
- Web Worker message handling (mock postMessage)
- Zod schemas
- API route handlers

❌ Don't Test:
- Three.js rendering (use visual regression instead)
- CSS styles
- Third-party library internals
```

---

## 8. Git Conventions

### Branch Naming

```
feature/3d-agent-nodes
feature/control-panel
fix/memory-leak-dispose
refactor/store-architecture
docs/design-system
```

### Commit Messages

```
feat: add AgentNode 3D component with glow effect
fix: dispose geometry/material on agent removal
perf: switch to InstancedMesh for particles
refactor: move force layout to Web Worker
docs: update design system with custom dropdown
test: add unit tests for agentStore
chore: upgrade Three.js to 0.170
```

---

## 9. Performance Checklist

Trước mỗi PR, kiểm tra:

- [ ] Không có `console.log` trong production code
- [ ] Geometry/Material được `dispose()` khi unmount
- [ ] Không tạo new objects trong `useFrame()`
- [ ] Store subscriptions chỉ select cần thiết (không `state => state`)
- [ ] Positions đọc qua `getState()` trong `useFrame()`
- [ ] Large lists sử dụng virtualization
- [ ] Images/assets được optimize
- [ ] No `any` types
- [ ] Zod validation trên tất cả API inputs
