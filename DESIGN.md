# Nirvayak Global — UI/UX Design System & Style Guide

A comprehensive specification of color palettes, typography, components, and layout tokens used across the Nirvayak Global digital ecosystem.

---

## 1. Color System

The color system is architected around an **Enterprise Light Theme** emphasizing clarity, reliability, and precision.

### 1.1 Brand & Action Colors
| Token Name | Hex Code | Tailwind Equivalent | Role & Application |
| :--- | :--- | :--- | :--- |
| `primary` | `#2563EB` | `blue-600` | Primary buttons, active tabs, key icons, focused states |
| `primary-hover` | `#1D4ED8` | `blue-700` | Hover states for primary buttons and high-priority links |
| `primary-accent` | `#3B82F6` | `blue-500` | Visual telemetry lines, gradient stops, secondary highlights |
| `primary-tint` | `#EFF6FF` | `blue-50` | Badge backgrounds, active pill fills, subtle icon glow circles |
| `primary-deep` | `#004AC6` | — | Deep brand contrast accents, logo tone |

### 1.2 Surface & Canvas Backgrounds
| Token Name | Hex Code | Tailwind Equivalent | Role & Application |
| :--- | :--- | :--- | :--- |
| `surface-canvas` | `#FFFFFF` | `white` | Cards, elevated containers, input fields, header bar |
| `surface-base` | `#F7F9FB` | `slate-50 / custom` | Main page body background, alternating section backgrounds |
| `surface-muted` | `#F1F5F9` | `slate-100` | Recessed segment bars, scrollbar tracks, code backgrounds |
| `surface-subtle` | `#ECEEF0` | — | Border fills, subtle divider fills |

### 1.3 Ink & Typography
| Token Name | Hex Code | Tailwind Equivalent | Role & Application |
| :--- | :--- | :--- | :--- |
| `text-primary` | `#0F172A` | `slate-900` | Main headings (`h1`–`h4`), key metrics, primary readable body |
| `text-secondary` | `#334155` | `slate-700` | Descriptive copy, paragraph text, card summaries |
| `text-muted` | `#64748B` | `slate-500` | Metadata labels, breadcrumbs, timestamps, category tags |
| `text-placeholder` | `#94A3B8` | `slate-400` | Form field placeholders, disabled labels, decorative icons |

### 1.4 Borders & Dividers
| Token Name | Hex Code | Tailwind Equivalent | Role & Application |
| :--- | :--- | :--- | :--- |
| `border-subtle` | `#E2E8F0` | `slate-200` | Default card borders, header lower divider, table rows |
| `border-strong` | `#CBD5E1` | `slate-300` | Form field borders, card hover borders |
| `border-focus` | `#93C5FD` | `blue-300` | Focus outlines, active badge borders |

---

## 2. Typography

### 2.1 Font Families
* **Heading Font**: `'Hanken Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
* **Body Font**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
* **Monospace / Code Font**: `'JetBrains Mono', monospace`

### 2.2 Scale & Hierarchy
| Style | Font Family | Size | Weight | Line Height | Letter Spacing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Headline XL** | Hanken Grotesk | `3.5rem` (56px) | `700` | `4.0rem` | `-0.025em` |
| **Headline XL (Mobile)** | Hanken Grotesk | `2.25rem` (36px) | `700` | `2.75rem` | `-0.02em` |
| **Headline LG** | Hanken Grotesk | `2.5rem` (40px) | `600` | `3.0rem` | `-0.02em` |
| **Headline MD** | Hanken Grotesk | `1.75rem` (28px) | `600` | `2.25rem` | `-0.015em` |
| **Headline SM** | Hanken Grotesk | `1.25rem` (20px) | `600` | `1.75rem` | `-0.01em` |
| **Body LG** | Inter | `1.125rem` (18px) | `400` | `1.75rem` | `-0.005em` |
| **Body MD** | Inter | `1.0rem` (16px) | `400` | `1.5rem` | `0` |
| **Body SM** | Inter | `0.875rem` (14px) | `400` | `1.25rem` | `0` |
| **Label / Badge** | Inter | `0.75rem` (12px) | `600` | `1.0rem` | `0.02em` |

---

## 3. Elevation & Depth

* **Resting Card (Level 1)**:
  * Background: `#FFFFFF`
  * Border: `1px solid #E2E8F0`
  * Box Shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)`
* **Hover / Floating Card (Level 2)**:
  * Transform: `translateY(-2px)`
  * Border: `1px solid #CBD5E1`
  * Box Shadow: `0 10px 15px -3px rgba(15, 23, 42, 0.06), 0 4px 6px -4px rgba(15, 23, 42, 0.03)`
* **Overlays & Modals (Level 3)**:
  * Background: `#FFFFFF`
  * Border: `1px solid #CBD5E1`
  * Box Shadow: `0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`

---

## 4. Corner Radius & Spacing

### 4.1 Corner Radii
* `rounded-sm`: `0.25rem` (4px) — Buttons, form inputs, mini badges
* `rounded-md`: `0.375rem` (6px) — Select menus, tags
* `rounded-lg`: `0.5rem` (8px) — Cards, modals, containers
* `rounded-full`: `9999px` — Status pills, circular avatars

### 4.2 Spacing Base (8-point Grid)
* `space-xs`: `0.25rem` (4px)
* `space-sm`: `0.5rem` (8px)
* `space-md`: `1.0rem` (16px)
* `space-lg`: `1.5rem` (24px)
* `space-xl`: `2.5rem` (40px)
* `section-padding`: `4.0rem` to `6.0rem` (64px - 96px)

---

## 5. UI Components

### 5.1 Buttons
* **Primary Button**:
  * Default: `background: #2563EB`, `color: #FFFFFF`, `font-weight: 600`, `border-radius: 0.375rem`
  * Hover: `background: #1D4ED8`
  * Active: `transform: scale(0.98)`
  * Focus: `outline: 2px solid #93C5FD`, `outline-offset: 2px`
* **Secondary Button**:
  * Default: `background: #FFFFFF`, `border: 1px solid #E2E8F0`, `color: #0F172A`
  * Hover: `background: #F8FAFC`, `border-color: #CBD5E1`
* **Ghost Button**:
  * Default: `background: transparent`, `color: #2563EB`
  * Hover: `background: #EFF6FF`

### 5.2 Form Inputs
* **Default**: `background: #FFFFFF`, `border: 1px solid #CBD5E1`, `color: #0F172A`, `padding: 0.625rem 0.875rem`, `border-radius: 0.375rem`
* **Focus State**: `border-color: #2563EB`, `box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12)`
* **Placeholder**: `color: #94A3B8`

### 5.3 Badges & Chips
* **Active Status / Highlight Pill**:
  * Background: `#EFF6FF`
  * Text: `#1D4ED8`
  * Border: `1px solid #BFDBFE`
  * Text Style: `font-size: 0.75rem`, `font-weight: 600`, `letter-spacing: 0.02em`

### 5.4 Patterns & Decorative Graphics
* **Light Grid Pattern**:
  ```css
  .bg-grid-pattern-light {
    background-size: 40px 40px;
    background-image:
      linear-gradient(to right, rgba(15, 23, 42, 0.035) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(15, 23, 42, 0.035) 1px, transparent 1px);
  }
  ```
* **Dot Matrix Pattern**:
  ```css
  .bg-dot-pattern-light {
    background-image: radial-gradient(rgba(15, 23, 42, 0.06) 1px, transparent 1px);
    background-size: 24px 24px;
  }
  ```

---

## 6. Tailwind CSS Theme Quick Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb', // Enterprise Cobalt
          hover: '#1d4ed8',   // Royal Navy
          accent: '#3b82f6',  // Radiant Blue
          tint: '#eff6ff',    // Ice Blue
        },
        surface: {
          DEFAULT: '#ffffff',
          base: '#f7f9fb',
          muted: '#f1f5f9',
        },
        ink: {
          primary: '#0f172a',
          secondary: '#334155',
          muted: '#64748b',
          placeholder: '#94a3b8',
        },
        border: {
          subtle: '#e2e8f0',
          strong: '#cbd5e1',
          focus: '#93c5fd',
        }
      },
      fontFamily: {
        heading: ['Hanken Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    }
  }
};
```