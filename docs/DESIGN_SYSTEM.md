# MAOP Design System — "Cyber Nexus"

> **Version**: 1.0  
> **Theme**: Cyberpunk / Futuristic Dark Mode  
> **Preview**: Mở `design-system-preview.html` ở root để xem live preview tất cả components.

---

## Mục Lục

1. [Triết Lý Thiết Kế](#1-triết-lý-thiết-kế)
2. [Design Tokens](#2-design-tokens)
3. [Typography](#3-typography)
4. [Color System](#4-color-system)
5. [Spacing & Layout](#5-spacing--layout)
6. [Effects & Patterns](#6-effects--patterns)
7. [Component Library](#7-component-library)
8. [Animation System](#8-animation-system)
9. [Responsive Strategy](#9-responsive-strategy)
10. [MUI Theme Integration](#10-mui-theme-integration)
11. [3D Scene Styling](#11-3d-scene-styling)

---

## 1. Triết Lý Thiết Kế

### Nguyên Tắc Cốt Lõi

| Nguyên Tắc | Mô Tả |
|------------|--------|
| **Dark-first** | Background tối sâu (`#0a0a0f`) làm nền, nội dung sáng nổi bật lên |
| **Glow over Shadow** | Thay vì box-shadow truyền thống, dùng glow effects (colored blur) tạo cảm giác phát sáng |
| **Glassmorphism** | Panel sử dụng `backdrop-filter: blur()` + nền bán trong suốt, tạo lớp kính mờ |
| **Micro-animation** | Mọi interaction đều có animation: hover, focus, open/close, state change |
| **Information Density** | Giao diện monitoring cần hiển thị nhiều data → ưu tiên compact layout + monospace font cho số liệu |
| **Cyberpunk Aesthetic** | Viền sáng neon, gradient glow, particle effects, grid overlay — tạo cảm giác sci-fi |

### Tông Màu Chủ Đạo

Hệ thống sử dụng **5 accent colors** trên nền tối, mỗi màu có semantic meaning rõ ràng:

- 🔵 **Cyan** (`#00f5ff`) — Primary, active, selected, data flow
- 🟣 **Violet** (`#8b5cf6`) — Secondary, focus, selections
- 🔴 **Magenta** (`#ff006e`) — Danger, errors, alerts
- 🟢 **Emerald** (`#10b981`) — Success, active, connected
- 🟡 **Amber** (`#f59e0b`) — Warning, attention needed

---

## 2. Design Tokens

Tất cả giá trị thiết kế được định nghĩa dưới dạng **CSS Custom Properties** trong `:root`. Không hardcode giá trị trực tiếp vào component.

### Cách Sử Dụng

```css
/* ✅ Đúng — dùng token */
.my-component {
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
    border-radius: var(--radius-md);
    padding: var(--space-4);
}

/* ❌ Sai — hardcode */
.my-component {
    background: #1a1a2e;
    color: #e2e8f0;
    border-radius: 10px;
    padding: 16px;
}
```

### Trong TypeScript/React

Khi cần dùng token trong JS (ví dụ Three.js material color), import từ theme constants:

```typescript
// src/theme/tokens.ts
export const tokens = {
    colors: {
        accentCyan: '#00f5ff',
        accentMagenta: '#ff006e',
        accentViolet: '#8b5cf6',
        accentEmerald: '#10b981',
        accentAmber: '#f59e0b',
        bgPrimary: '#0a0a0f',
        bgSecondary: '#12121a',
        bgElevated: '#1a1a2e',
    },
    // ... other tokens
} as const;
```

---

## 3. Typography

### Font Families

| Token | Font | Weight Range | Dùng Cho |
|-------|------|-------------|----------|
| `--font-display` | **Orbitron** | 400–900 | Headings, branding, số liệu lớn, agent names |
| `--font-body` | **Inter** | 300–700 | Body text, paragraphs, form labels, descriptions |
| `--font-mono` | **JetBrains Mono** | 400–600 | Code, logs, metrics, timestamps, badges, token counts |

### Google Fonts Import

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Orbitron:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
```

### Font Size Scale

| Token | Size | Typical Usage |
|-------|------|--------------|
| `--font-size-xs` | `0.75rem` (12px) | Badges, timestamps, micro-labels |
| `--font-size-sm` | `0.875rem` (14px) | Body small, table cells, buttons |
| `--font-size-base` | `1rem` (16px) | Default body text |
| `--font-size-lg` | `1.125rem` (18px) | Large body, metric values |
| `--font-size-xl` | `1.25rem` (20px) | Sub-headings |
| `--font-size-2xl` | `1.5rem` (24px) | Section titles |
| `--font-size-3xl` | `1.875rem` (30px) | Page section titles |
| `--font-size-4xl` | `2.25rem` (36px) | Hero stat values |
| `--font-size-5xl` | `3rem` (48px) | Hero heading small |
| `--font-size-6xl` | `3.75rem` (60px) | Hero heading large |

### Quy Tắc Sử Dụng

```
Heading / Branding      → font-display (Orbitron), weight 600-900
Body / Description      → font-body (Inter), weight 400-600
Data / Code / Status    → font-mono (JetBrains Mono), weight 400-500
```

**Ví dụ cụ thể:**
- Agent card name → `font-display`, `font-size-sm`, weight 600
- Agent card description → `font-body`, `font-size-sm`, weight 400
- Token count "12,847" → `font-display`, `font-size-lg`, weight 700
- Log line "[10:23:45] INFO" → `font-mono`, `font-size-xs`, weight 400
- Section label "01 — COLORS" → `font-mono`, `font-size-xs`, uppercase, letter-spacing 3px

---

## 4. Color System

### Background Layers

Hệ thống sử dụng **layered backgrounds** — mỗi lớp UI nổi lên trên nền tối:

```
Layer 0 (deepest): --color-bg-primary    #0a0a0f     ← Page background, canvas bg
Layer 1:           --color-bg-secondary   #12121a     ← Panel backgrounds, dropdown bg
Layer 2:           --color-bg-elevated    #1a1a2e     ← Cards, modals, active tabs
Layer 3:           --color-bg-glass       rgba(26,26,46,0.65)  ← Glassmorphism panels
Layer 4:           --color-surface        #16213e     ← Interactive surfaces, hover states
```

### Accent Colors — Semantic Mapping

```
Cyan    #00f5ff  →  Primary action, active node, data streaming, selected state
                    Dùng cho: Primary buttons, active borders, glow effects,
                    selected items, main accent throughout UI

Magenta #ff006e  →  Danger, destructive action, error state, alert
                    Dùng cho: Delete buttons, error badges, alert glow,
                    safety warnings, critical metrics

Violet  #8b5cf6  →  Secondary, focus, selection, alternative accent
                    Dùng cho: Focus rings, secondary highlights, stable badges,
                    selected tabs (alternative to cyan)

Emerald #10b981  →  Success, healthy, connected, active (status)
                    Dùng cho: Active badges, success states, uptime indicators,
                    healthy connection dots

Amber   #f59e0b  →  Warning, attention, caution, pending
                    Dùng cho: Warning badges, rate limit alerts,
                    pending states, message counts
```

### Text Colors

```
--color-text-primary    #e2e8f0    ← Main text, headings, important content
--color-text-secondary  #94a3b8    ← Descriptions, secondary info, labels
--color-text-muted      #475569    ← Timestamps, disabled text, hints
```

### Border Colors

```
--color-border          rgba(0,245,255, 0.12)   ← Default borders (very subtle)
--color-border-strong   rgba(0,245,255, 0.30)   ← Hover borders, active panels
```

### Cách Tạo Variant Màu

Khi cần variant nhạt/đậm của accent color, dùng rgba:

```css
/* Background tint (rất nhạt, dùng cho badge/card background) */
background: rgba(0, 245, 255, 0.12);   /* cyan 12% */
background: rgba(255, 0, 110, 0.12);   /* magenta 12% */

/* Border tint */
border: 1px solid rgba(0, 245, 255, 0.25);

/* Hover background */
background: rgba(0, 245, 255, 0.08);   /* cyan 8% — rất subtle */
```

---

## 5. Spacing & Layout

### Spacing Scale

Sử dụng hệ thống spacing **4px base**:

| Token | Value | Dùng Cho |
|-------|-------|----------|
| `--space-1` | 4px | Micro gap (icon-text trong badge) |
| `--space-2` | 8px | Small gap (giữa các badges, padding nhỏ) |
| `--space-3` | 12px | Medium-small (input padding, card internal gaps) |
| `--space-4` | 16px | Default gap (giữa các form fields, card padding) |
| `--space-5` | 20px | Agent card padding |
| `--space-6` | 24px | Glass card padding, section internal spacing |
| `--space-8` | 32px | Section gap, large component spacing |
| `--space-10` | 40px | Major section spacing |
| `--space-12` | 48px | Large gap (hero stats) |
| `--space-16` | 64px | Section divider margin |
| `--space-20` | 80px | Section bottom margin |

### Border Radius

| Token | Value | Dùng Cho |
|-------|-------|----------|
| `--radius-sm` | 6px | Small elements: badges nội bộ, metric boxes |
| `--radius-md` | 10px | Medium: input fields, buttons, dropdowns, icon buttons |
| `--radius-lg` | 16px | Large: cards, panels, agent cards |
| `--radius-xl` | 24px | Extra large: hero sections, large modals |
| `--radius-full` | 9999px | Circular: badges, dots, pills, slider thumb |

### Layout Grid

```css
/* Page wrapper */
max-width: 1400px;
margin: 0 auto;
padding: var(--space-8) var(--space-6);    /* 32px 24px */

/* Component grids */
.components-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: var(--space-6);
}

/* 2-column layout */
grid-template-columns: 1fr 1fr;

/* 3-column agent cards */
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
```

---

## 6. Effects & Patterns

### Glassmorphism

Ba cấp độ glassmorphism:

```css
/* Level 1 — Subtle (floating labels, overlays nhẹ) */
background: rgba(26, 26, 46, 0.30);
backdrop-filter: blur(10px);
border: 1px solid rgba(0, 245, 255, 0.08);

/* Level 2 — Standard (panels, cards — SỬ DỤNG NHIỀU NHẤT) */
background: rgba(26, 26, 46, 0.65);     /* var(--color-bg-glass) */
backdrop-filter: blur(20px);
border: 1px solid rgba(0, 245, 255, 0.12);  /* var(--color-border) */

/* Level 3 — Heavy (modals, critical panels) */
background: rgba(26, 26, 46, 0.80);
backdrop-filter: blur(30px);
border: 1px solid rgba(0, 245, 255, 0.20);
```

### Glow Effects

Glow dùng `box-shadow` với color spread:

```css
/* Glow tokens — đã có sẵn trong :root */
--glow-cyan:        0 0 20px rgba(0, 245, 255, 0.4), 0 0 60px rgba(0, 245, 255, 0.1);
--glow-cyan-strong: 0 0 20px rgba(0, 245, 255, 0.6), 0 0 60px rgba(0, 245, 255, 0.2), 0 0 100px rgba(0, 245, 255, 0.1);
--glow-magenta:     0 0 20px rgba(255, 0, 110, 0.4), 0 0 60px rgba(255, 0, 110, 0.1);
--glow-violet:      0 0 20px rgba(139, 92, 246, 0.4), 0 0 60px rgba(139, 92, 246, 0.1);
--glow-emerald:     0 0 20px rgba(16, 185, 129, 0.4), 0 0 60px rgba(16, 185, 129, 0.1);
```

**Khi nào dùng glow:**
- Hover state trên buttons và cards
- Active/selected state
- 3D node đang active
- Focus ring trên input fields
- Status dots đang pulse

### Gradient Patterns

```css
/* Text gradient — dùng cho headings */
background: linear-gradient(135deg, var(--color-text-primary), var(--color-accent-cyan));
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;

/* Hero gradient — multi-color */
background: linear-gradient(135deg, #00f5ff 0%, #8b5cf6 50%, #ff006e 100%);

/* Top accent line trên card */
background: linear-gradient(90deg, transparent, var(--color-accent-cyan), transparent);

/* Section divider */
background: linear-gradient(90deg, transparent, var(--color-border-strong), transparent);

/* Metric bar fill — fade from left */
background: linear-gradient(90deg, rgba(0,245,255,0.2), var(--color-accent-cyan));

/* Button gradient */
background: linear-gradient(135deg, var(--color-accent-cyan), #0099aa);
```

### Background Grid Overlay

Grid pattern tạo cảm giác wireframe/blueprint:

```css
.grid-overlay {
    background-image:
        linear-gradient(rgba(0, 245, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 245, 255, 0.03) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%);
}
```

---

## 7. Component Library

### 7.1 Buttons

**4 variants:**

| Variant | Class | Dùng Cho |
|---------|-------|----------|
| Primary | `.btn .btn-primary` | Main CTA: Add Agent, Deploy, Start |
| Secondary | `.btn .btn-secondary` | Secondary actions: Configure, Edit |
| Danger | `.btn .btn-danger` | Destructive: Remove, Delete, Stop |
| Ghost | `.btn .btn-ghost` | Tertiary: Cancel, Close |

**Icon Button:** `.btn-icon` — 40×40px square, dùng cho toolbar actions

**Hover behavior:**
- Tất cả buttons có `transform: translateY(-2px)` khi hover
- Primary/Danger: glow effect mạnh
- Secondary: background fill + glow
- Ghost: subtle background change

```html
<button class="btn btn-primary">
    <svg>...</svg>  <!-- Optional icon, 14x14 -->
    Add Agent
</button>
```

### 7.2 Status Badges

**4 states:**

| State | Class | Dot Animation | Dùng Cho |
|-------|-------|--------------|----------|
| Active | `.badge .badge-active` | Pulse 1.5s | Agent đang hoạt động, connected |
| Processing | `.badge .badge-processing` | Pulse 0.8s (nhanh) | Đang stream, đang xử lý |
| Error | `.badge .badge-error` | Không pulse | Lỗi, disconnected |
| Idle | `.badge .badge-idle` | Không pulse | Chờ, không hoạt động |

```html
<span class="badge badge-processing">
    <span class="dot"></span>
    Streaming
</span>
```

### 7.3 Input Fields

**Text Input:**
```html
<div class="input-wrapper">
    <label class="input-label">AGENT NAME</label>
    <input type="text" class="input-field" placeholder="e.g. Research Analyst">
</div>
```

- Label: `font-mono`, `font-size-xs`, uppercase, letter-spacing 1.5px
- Field: `bg-primary`, `border`, `radius-md`
- Focus: cyan border + glow + focus ring

**Custom Dropdown (KHÔNG dùng native `<select>`):**

```html
<div class="custom-select" id="my-select">
    <div class="custom-select-trigger" tabindex="0">
        <div class="custom-select-trigger-content">
            <div class="custom-select-trigger-icon" style="...">✦</div>
            <span class="custom-select-trigger-label">Option Name</span>
            <span class="custom-select-trigger-badge" style="...">Badge</span>
        </div>
        <div class="custom-select-chevron">
            <svg><!-- chevron down --></svg>
        </div>
    </div>
    <div class="custom-select-dropdown">
        <div class="custom-select-header">GROUP NAME</div>
        <div class="custom-select-option selected" data-value="..." data-icon="..." ...>
            <div class="custom-select-option-icon" style="...">✦</div>
            <div class="custom-select-option-info">
                <div class="custom-select-option-name">Option Name</div>
                <div class="custom-select-option-desc">Description text</div>
            </div>
            <span class="custom-select-option-badge" style="...">Badge</span>
        </div>
        <div class="custom-select-divider"></div>
        <!-- more options -->
    </div>
</div>
```

Features:
- Grouped options với headers và dividers
- Icon + name + description + badge per option
- Selected indicator (cyan bar bên trái)
- Animated open/close (scale + opacity)
- Chevron xoay 180° khi mở
- Click outside to close
- Keyboard: Enter/Space to toggle, Escape to close

**Range Slider:**
```html
<input type="range" class="input-range" min="0" max="100" value="70">
```

### 7.4 Glass Card

Container chính cho panels:

```html
<div class="glass-card">
    <!-- content -->
</div>
```

- Glassmorphism level 2
- Hover: border sáng hơn + glow + translateY(-2px)

### 7.5 Agent Card

```html
<div class="agent-card active">  <!-- .active cho glow border -->
    <div class="agent-card-header">
        <div style="display: flex; align-items: center; gap: var(--space-3);">
            <div class="agent-avatar cyan">🤖</div>  <!-- .cyan/.violet/.magenta/.emerald -->
            <div>
                <div class="agent-card-name">Agent Name</div>
                <div class="agent-card-model">GPT-4o · temp 0.7</div>
            </div>
        </div>
        <span class="badge badge-processing"><span class="dot"></span>Streaming</span>
    </div>
    <div class="agent-card-body">Description...</div>
    <div class="agent-card-metrics">
        <div class="agent-metric">
            <div class="agent-metric-label">TOKENS</div>
            <div class="agent-metric-value cyan">12,847</div>
        </div>
        <!-- 3 more metrics -->
    </div>
</div>
```

### 7.6 Navigation Tabs

```html
<div class="nav-tabs">
    <button class="nav-tab active">Agents</button>
    <button class="nav-tab">Workflows</button>
    <button class="nav-tab">Metrics</button>
    <button class="nav-tab">Logs</button>
</div>
```

### 7.7 Log Viewer

```html
<div class="log-viewer">
    <div class="log-line">
        <span class="log-time">10:23:45</span>
        <span class="log-level info">INFO</span>   <!-- .info/.warn/.error/.debug -->
        <span class="log-source">[agent_01]</span>
        <span class="log-msg">Message text here</span>
    </div>
</div>
```

### 7.8 Token Stream

```html
<div class="token-stream">
    <span class="token-counter">347 tokens</span>
    <span id="streaming-text">Streamed text appears here...</span>
    <span class="cursor"></span>   <!-- blinking cursor -->
</div>
```

### 7.9 Metrics Bar

```html
<div class="metric-row">
    <span class="metric-label">GPU Usage</span>
    <div class="metric-bar-track">
        <div class="metric-bar-fill cyan" style="width: 67%;"></div>
    </div>
    <span class="metric-value">67%</span>
</div>
```

Bar fill variants: `.cyan`, `.violet`, `.magenta`, `.emerald`

---

## 8. Animation System

### Timing Functions

| Token | Value | Dùng Cho |
|-------|-------|----------|
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Hầu hết transitions (bắt đầu nhanh, kết thúc mượt) |
| `--ease-in-out-sine` | `cubic-bezier(0.37, 0, 0.63, 1)` | Looping animations (float, pulse) |

### Duration Scale

| Token | Value | Dùng Cho |
|-------|-------|----------|
| `--duration-fast` | 150ms | Hover color changes, opacity |
| `--duration-normal` | 300ms | Card hover, dropdown open/close, button hover |
| `--duration-slow` | 500ms | Panel slide in/out, major transitions |
| `--duration-very-slow` | 1000ms | Page transitions, initial load animations |

### Keyframe Animations

| Animation | Duration | Dùng Cho |
|-----------|----------|----------|
| `pulse-dot` | 1.5s / 0.8s | Status badge dots — scale + opacity oscillate |
| `pulse-ring` | 2s | Graph node outer ring — scale up + fade out |
| `float` | 4s | Graph nodes — subtle vertical bobbing |
| `blink` | 0.8s | Cursor in token stream |
| `glow-pulse` | 2s | Glow effect orbs — brightness oscillate |
| `fadeIn` | 0.3s | New log lines appearing |
| `fadeInUp` | 0.8s | Scroll reveal, hero elements |
| `fadeInDown` | 0.8s | Hero badge entrance |

### Scroll Reveal Pattern

Tất cả `<section>` sử dụng IntersectionObserver để fade in khi scroll tới:

```javascript
section.style.opacity = '0';
section.style.transform = 'translateY(30px)';
section.style.transition = 'opacity 0.8s ease-out-expo, transform 0.8s ease-out-expo';
// → becomes opacity: 1, translateY(0) when intersecting
```

---

## 9. Responsive Strategy

### Breakpoints

| Breakpoint | Width | Changes |
|------------|-------|---------|
| Desktop | > 768px | Full grid layouts, side-by-side panels |
| Tablet/Mobile | ≤ 768px | Single column, reduced spacing, smaller hero |

### Responsive Rules

```css
@media (max-width: 768px) {
    /* Page: reduce padding */
    .page-wrapper { padding: var(--space-4); }
    
    /* Hero: smaller text */
    .hero h1 { font-size: var(--font-size-3xl); }
    .hero-stats { flex-direction: column; }
    
    /* Grids: single column */
    .components-grid { grid-template-columns: 1fr; }
    .color-grid { grid-template-columns: repeat(2, 1fr); }
    
    /* Typography rows: stack */
    .type-row { flex-direction: column; }
    
    /* Graph preview: shorter */
    .agent-graph-preview { height: 350px; }
}
```

---

## 10. MUI Theme Integration

Khi dùng Material UI, override theme cho đồng bộ với design system:

```typescript
// src/theme/theme.ts
import { createTheme } from '@mui/material/styles';

export const muiTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#00f5ff',        // accent-cyan
            contrastText: '#0a0a0f',
        },
        secondary: {
            main: '#8b5cf6',        // accent-violet
        },
        error: {
            main: '#ff006e',        // accent-magenta
        },
        success: {
            main: '#10b981',        // accent-emerald
        },
        warning: {
            main: '#f59e0b',        // accent-amber
        },
        background: {
            default: '#0a0a0f',     // bg-primary
            paper: '#1a1a2e',       // bg-elevated
        },
        text: {
            primary: '#e2e8f0',
            secondary: '#94a3b8',
            disabled: '#475569',
        },
        divider: 'rgba(0, 245, 255, 0.12)',
    },
    typography: {
        fontFamily: "'Inter', sans-serif",
        h1: { fontFamily: "'Orbitron', sans-serif" },
        h2: { fontFamily: "'Orbitron', sans-serif" },
        h3: { fontFamily: "'Orbitron', sans-serif" },
        h4: { fontFamily: "'Orbitron', sans-serif" },
        h5: { fontFamily: "'Orbitron', sans-serif" },
        h6: { fontFamily: "'Orbitron', sans-serif" },
        code: { fontFamily: "'JetBrains Mono', monospace" },
    },
    shape: {
        borderRadius: 10,  // radius-md
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 10,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0, 245, 255, 0.12)',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 10,
                        '&:hover fieldset': {
                            borderColor: 'rgba(0, 245, 255, 0.3)',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#00f5ff',
                            boxShadow: '0 0 20px rgba(0, 245, 255, 0.4)',
                        },
                    },
                },
            },
        },
    },
});
```

---

## 11. 3D Scene Styling

### Màu Sắc Cho Three.js Materials

```typescript
// Agent Node Colors (Three.js Color objects)
const NODE_COLORS = {
    default: new THREE.Color('#00f5ff'),     // cyan
    processing: new THREE.Color('#00f5ff'),   // cyan + bloom
    idle: new THREE.Color('#475569'),         // muted
    error: new THREE.Color('#ff006e'),        // magenta
    success: new THREE.Color('#10b981'),      // emerald
};

// Edge / Connection Colors
const EDGE_COLORS = {
    active: new THREE.Color('#00f5ff'),
    inactive: new THREE.Color('#1a1a2e'),
};

// Particle Colors
const PARTICLE_COLORS = {
    token: new THREE.Color('#00f5ff'),
    alert: new THREE.Color('#ff006e'),
    data: new THREE.Color('#8b5cf6'),
};

// Scene Background
scene.background = new THREE.Color('#0a0a0f');

// Ambient Light
const ambientLight = new THREE.AmbientLight('#1a1a2e', 0.5);

// Point Lights (glow sources at active nodes)
const pointLight = new THREE.PointLight('#00f5ff', 1, 50);
```

### Post-Processing (Bloom)

```typescript
// @react-three/postprocessing settings
<EffectComposer>
    <Bloom
        intensity={1.5}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        mipmapBlur
    />
</EffectComposer>
```

### HTML Overlay Trên 3D Node (drei)

```tsx
// Sử dụng @react-three/drei Html component
<Html position={[x, y, z]} center distanceFactor={10}>
    <div className="agent-card" style={{ width: 280 }}>
        {/* Agent card content */}
    </div>
</Html>
```

---

## Checklist Khi Tạo Component Mới

- [ ] Sử dụng CSS custom properties (tokens), không hardcode
- [ ] Font đúng family: display/body/mono
- [ ] Border radius dùng token
- [ ] Spacing dùng token
- [ ] Có hover state với transition
- [ ] Có glow effect cho interactive elements
- [ ] Sử dụng glassmorphism cho panel/card
- [ ] Responsive tại breakpoint 768px
- [ ] Animation dùng `--ease-out-expo` timing function
- [ ] Text color đúng hierarchy: primary/secondary/muted
- [ ] Nếu hiển thị status → dùng semantic accent color
