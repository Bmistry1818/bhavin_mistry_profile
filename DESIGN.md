# DESIGN.md: Bhavin Mistry Enterprise AI Platform (V2 UI — Recalibrated)

## Design Read
Reading this as: Executive AI Systems & 3D Interactive Engineering Portfolio for CTOs, Boards, and AI Platform Leaders, in a Crisp Architectural Studio & Spatial Blueprint aesthetic, dial **ENERGY 3 / RHYTHM 3 / MOTION 3**.

## Liveliness Dials
- **ENERGY: 3** (Above-the-fold interactive 3D spatial routing topology paired with decisive display typography and high-contrast Cobalt Signal focal points)
- **RHYTHM: 3** (Varied asymmetric sections: 2-column 3D split hero -> editorial lead + broadsheet index -> obsidian contrast ecosystems -> live animated SVG architecture flow -> ruled radar ledger -> 2-tier interactive FinOps lab)
- **MOTION: 3** (60fps interactive 3D projection canvas with drag-orbit & hover inspection, GPU 3D perspective card tilt on pointer devices, live SVG flow simulation, and CSS scroll-driven progress bar — all with user Pause/Play control and strict `prefers-reduced-motion` safety)

## Color Palette (Recalibrated: 2 Neutral Planes + 1 Cobalt Signal Accent)
- **Light Mode (Crisp Architectural Titanium)**
  - Primary Surface (`--paper`): `#f6f7fa`
  - Elevated Surface (`--paper-elevated`): `#ffffff`
  - Subtle Tonal Wash (`--wash`): `#ebeff5`
  - Ink Primary (`--ink`): `#0c1322`
  - Ink Secondary (`--ink-soft`): `#2a364b`
  - Ink Muted (`--muted`): `#4a576e` (WCAG AA > 6.8:1)
  - Accent (`--accent`): `#1d4ed8` (Cobalt Signal, WCAG AA > 6.5:1 on light surfaces)
- **Dark Mode (Obsidian Spatial Lab)**
  - Primary Surface (`--paper`): `#060911`
  - Elevated Surface (`--paper-elevated`): `#0d1422`
  - Subtle Tonal Wash (`--wash`): `#131c2e`
  - Ink Primary (`--ink`): `#f1f5f9`
  - Ink Secondary (`--ink-soft`): `#cbd5e1`
  - Ink Muted (`--muted`): `#94a3b8` (WCAG AA > 6.5:1)
  - Accent (`--accent`): `#60a5fa` (Luminous Cobalt, WCAG AA > 7.5:1 on dark surfaces)

## Typography
- **Display Serif:** `Newsreader`
- **Interface Sans:** `Plus Jakarta Sans`
- **Structured Mono:** `JetBrains Mono`
- Sized exclusively in `rem` and `clamp()` (`max <= 2.5 * min`).

## 3D & Interactive Guardrails
- Interactive 3D canvases expose explicit Pause/Play toggle buttons (`WCAG 2.2.2`, label swap without contradictory `aria-pressed`) and accessible keyboard mode controls.
- Continuous motion defaults to paused under `@media (prefers-reduced-motion: reduce)`.
- Zero generic blue-purple rainbow gradients; zero invented SLA/latency telemetry numbers; zero horizontal overflow down to `320px`.
