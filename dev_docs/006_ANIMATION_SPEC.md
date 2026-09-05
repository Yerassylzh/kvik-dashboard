# 006. Animation & Motion Specification

## 1. Objectives & Motion Philosophy

In modern web applications (Linear, Stripe, Supabase, Raycast), animation is not mere decoration; it is a core usability and engineering pillar:

- **Perceived Performance**: Phased AI progress timelines and shimmer skeletons reduce perceived waiting latency during scraping and parsing.
- **Spatial Awareness**: Directional sliding (`StepTransition`) communicates forward progress vs. backtracking.
- **Tactile Feedback**: Subtle hover elevation (`scale: 1.02`), active presses (`scale: 0.98`), and glowing focus rings make the UI feel responsive and tangible.
- **Cognitive Guidance**: Staggered cascading item entrances guide the user's eye naturally from top to bottom.

---

## 2. Technical Stack & Architecture

We leverage `motion` (the official modern React 19 motion package) combined with Tailwind CSS v4 design tokens:

1. **Lightweight CSS/Tailwind (for basic micro-interactions)**:
   - Button hovers, border color shifts, spinners, and subtle ring highlights.
2. **Motion Primitives (`motion/react`)**:
   - Directional step transition with height adaptation (`StepTransition`).
   - Cascading list reveals (`StaggerContainer` + `StaggerItem`).
   - Multi-phase AI processing state indicators (`AiProcessingTimeline`).
   - Interactive lift cards (`InteractiveCard`).
   - Celebration checkmark animation (`CelebrationCheckmark`).

### Motion Tokens & Physics

| Token           | Duration | Easing / Spring                 | Usage                                |
| --------------- | -------- | ------------------------------- | ------------------------------------ |
| `fast`          | `150ms`  | `cubic-bezier(0.16, 1, 0.3, 1)` | Tooltips, button hovers, badges      |
| `normal`        | `250ms`  | `cubic-bezier(0.16, 1, 0.3, 1)` | Dropdowns, tabs, card selection      |
| `slow`          | `400ms`  | `cubic-bezier(0.16, 1, 0.3, 1)` | Screen slides, modal reveals         |
| `spring-snappy` | Spring   | `stiffness: 350, damping: 25`   | Tab pills, radio card selections     |
| `spring-gentle` | Spring   | `stiffness: 200, damping: 20`   | Collapsible panels, container height |

---

## 3. Reusable Motion Components Library (`components/ui/motion/`)

```
components/ui/motion/
├── StepTransition.tsx        # Directional screen slide with AnimatePresence
├── FadeIn.tsx                # Fade-in with optional directional offset
├── StaggerContainer.tsx      # Staggered container for cascading item entrances
├── StaggerItem.tsx           # Individual item inside StaggerContainer
├── InteractiveCard.tsx       # Elevated card with hover lift and tap feedback
├── AiProcessingTimeline.tsx  # Dynamic multi-phase AI progress indicator
├── ShimmerSkeleton.tsx       # Shimmer loading placeholder
└── CelebrationCheckmark.tsx  # Animated SVG checkmark on onboarding completion
```

---

## 4. Component API Specifications

### 4.1. `<StepTransition>`

Directional slide and fade between wizard steps. Supports forward (`direction = 1`) and backward (`direction = -1`) transitions.

```tsx
import { StepTransition } from "@/components/ui/motion/StepTransition";

<StepTransition stepKey={store.step} direction={direction}>
  {renderStepComponent()}
</StepTransition>;
```

### 4.2. `<FadeIn>`

Smooth entrance animation for headings, subtitles, alerts, and forms.

```tsx
import { FadeIn } from "@/components/ui/motion/FadeIn";

<FadeIn delay={0.1} direction="up" distance={12}>
  <h1 className="text-2xl font-bold">{title}</h1>
</FadeIn>;
```

### 4.3. `<StaggerContainer>` and `<StaggerItem>`

Cascading staggered reveal for lists, cards, and option grids.

```tsx
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/motion/StaggerContainer";

<StaggerContainer staggerDelay={0.06} className="grid grid-cols-3 gap-4">
  {items.map((item) => (
    <StaggerItem key={item.id}>
      <Card item={item} />
    </StaggerItem>
  ))}
</StaggerContainer>;
```

### 4.4. `<InteractiveCard>`

Reusable card with hover lift (`translateY(-2px)`, `scale: 1.01`) and active press feedback.

```tsx
import { InteractiveCard } from "@/components/ui/motion/InteractiveCard";

<InteractiveCard
  selected={isSelected}
  onClick={() => handleSelect(id)}
  className="p-5 rounded-2xl bg-card border"
>
  <CardContent />
</InteractiveCard>;
```

### 4.5. `<AiProcessingTimeline>`

Multi-phase animated timeline for background AI tasks (scraping, OCR, entity extraction).

```tsx
import { AiProcessingTimeline } from "@/components/ui/motion/AiProcessingTimeline";

<AiProcessingTimeline
  stages={[
    { id: "read", label: "Reading documents" },
    { id: "extract", label: "Extracting services & pricing" },
    { id: "structure", label: "Structuring catalog categories" },
  ]}
  currentStageIndex={currentStage}
  status="PROCESSING" // "PROCESSING" | "DONE" | "FAILED"
/>;
```

### 4.6. `<ShimmerSkeleton>`

Modern shimmer placeholder replacing static spinners.

```tsx
import { ShimmerSkeleton } from "@/components/ui/motion/ShimmerSkeleton";

<div className="space-y-3">
  <ShimmerSkeleton className="h-6 w-1/3 rounded-lg" />
  <ShimmerSkeleton className="h-16 w-full rounded-xl" />
</div>;
```

---

## 5. Accessibility & Performance Guidelines

1. **`prefers-reduced-motion`**:
   All motion components automatically respect user OS preferences by disabling translation offsets and defaulting to instant/subtle opacity transitions.
2. **GPU-Accelerated Properties**:
   Animations strictly target `transform` (`translate3d`, `scale`) and `opacity` to maintain consistent 60fps performance without triggering browser layout reflows.

---

## 6. Usage & Extensibility Guide

- Import all motion primitives from `@/components/ui/motion/*`.
- Use `<StepTransition>` for multi-step flows (onboarding, checkout, setup wizards).
- Use `<AiProcessingTimeline>` across dashboard features (knowledge base updates, campaign generation, sync operations).
