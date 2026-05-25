# CLAW — FIGMA MAKE BUILDER PROMPT
## Complete Frontend UI Design Specification
### For Figma Make / Figma AI Design Generation

---

## PROMPT START

Design a complete UI system for CLAW, a hybrid AI operating environment. CLAW has a Windows desktop overlay, a web dashboard, and a browser-based live view. The design language is dark, minimal, and technical with an electric blue accent. Think mission control meets personal AI cockpit.

---

## DESIGN TOKENS

### Colors

Primary Background: #1A1A2E
Secondary Background: #16213E
Tertiary Background: #1E1E36
Surface: #222240
Border: #2A2A4A
Border Hover: #3A3A5A

Text Primary: #E0E0E0
Text Secondary: #A0A0B0
Text Muted: #707080
Text Inverse: #1A1A2E

Accent: #00D4FF
Accent Hover: #33DDFF
Accent Pressed: #00AACC
Accent Subtle: rgba(0, 212, 255, 0.12)

Success: #00CC88
Success Subtle: rgba(0, 204, 136, 0.12)
Warning: #FFB700
Warning Subtle: rgba(255, 183, 0, 0.12)
Error: #FF4444
Error Subtle: rgba(255, 68, 68, 0.12)

Status Running: #00D4FF
Status Queued: #A0A0B0
Status Completed: #00CC88
Status Failed: #FF4444
Status Cancelled: #707080

### Typography

Font Family: Segoe UI, system-ui, -apple-system, sans-serif
Mono Font: Cascadia Code, Consolas, monospace

Display: 28px / 36px line-height / 600 weight
Heading 1: 24px / 32px line-height / 600 weight
Heading 2: 20px / 28px line-height / 600 weight
Heading 3: 16px / 24px line-height / 600 weight
Body: 14px / 20px line-height / 400 weight
Body Small: 13px / 18px line-height / 400 weight
Caption: 12px / 16px line-height / 400 weight
Mono Body: 13px / 18px line-height / 400 weight (Mono Font)
Mono Small: 11px / 16px line-height / 400 weight (Mono Font)

### Spacing Scale

4px (xxs)
8px (xs)
12px (sm)
16px (md)
20px (lg)
24px (xl)
32px (2xl)
48px (3xl)
64px (4xl)

### Border Radius

None: 0px
Small: 4px (buttons, inputs, badges)
Medium: 8px (cards, panels, modals)
Large: 12px (modals, dialogs)
Full: 9999px (pills, status dots)

### Shadows

None for most elements (flat dark theme)
Overlay Shadow: 0 8px 32px rgba(0, 0, 0, 0.5) (for modals and dropdowns)
Glow Accent: 0 0 12px rgba(0, 212, 255, 0.3) (for focused inputs and active states)

### Icon Size

Small: 16px
Medium: 20px
Large: 24px
XL: 32px

Icon style: outlined, 1.5px stroke, rounded caps. Use Lucide icon set or Phosphor icons.

---

## COMPONENT HIERARCHY

### Atoms (Base Elements)

Button Primary: height 40px, padding 12px 24px, bg Accent, text Text Inverse, radius Small, hover Accent Hover
Button Secondary: height 40px, padding 12px 24px, bg transparent, border 1px Border, text Text Primary, radius Small, hover bg Surface
Button Danger: height 40px, padding 12px 24px, bg Error, text #FFFFFF, radius Small
Button Ghost: height 36px, padding 8px 16px, bg transparent, text Text Secondary, hover text Text Primary
Button Icon: 36px x 36px, bg transparent, radius Full, hover bg Surface

Input Text: height 40px, padding 8px 12px, bg Secondary Background, border 1px Border, radius Small, focus border 2px Accent with Glow Accent shadow, text Text Primary, placeholder Text Muted

Badge Status: height 24px, padding 4px 10px, radius Full, font Caption
Badge Running: bg Accent Subtle, text Accent
Badge Queued: bg Surface, text Text Secondary
Badge Completed: bg Success Subtle, text Success
Badge Failed: bg Error Subtle, text Error
Badge Cancelled: bg Surface, text Text Muted

Status Dot: 8px diameter, radius Full
Dot Connected: fill Success
Dot Reconnecting: fill Warning, pulsing animation
Dot Disconnected: fill Error

Tooltip: bg #2A2A4A, text Text Primary, padding 6px 10px, radius Small, font Caption, max-width 240px

Divider: height 1px, bg Border, margin vertical 16px

### Molecules (Composed Components)

Status Bar: height 40px, bg Secondary Background, border-bottom 1px Border
Contents: Status Dot + connection text (left), Profile Badge (center), Settings Icon Button (right)

Event Timeline Item: padding 8px 12px, border-left 2px colored by event type
Contents: Event type icon (16px), description text (Body Small), timestamp (Caption, Text Muted, right-aligned)
Colors by type: agent.step = Accent, tool.called = Warning, tool.result = Success, job.error = Error, job.started/completed = Success, job.cancelled = Text Muted

Response Bubble: padding 12px 16px, bg Secondary Background, radius Medium, margin-bottom 8px
Contents: Response text (Body), timestamp (Caption, Text Muted), copy button (Icon Button, top-right on hover)

Command Input Bar: height 64px, bg Secondary Background, border-top 1px Border
Contents: Profile dropdown (left, compact), Text Input (flex fill), Mic Icon Button, Send Icon Button (Accent bg)

Permission Modal: max-width 400px, bg Secondary Background, radius Large, shadow Overlay Shadow, padding 24px
Contents: Warning icon (XL, Warning color), title "Permission Request" (Heading 3), description text, file path in mono font with bg Surface padding, Allow button (Primary), Deny button (Secondary), checkbox "Deny all this session" (Caption)

Job Row: height 56px, padding 12px 16px, hover bg Surface, border-bottom 1px Border
Contents: Job ID (Mono Small), Profile Badge, Status Badge, Duration (Caption), Timestamp (Caption, Text Muted), Action icons (view, cancel)

Stats Card: padding 16px, bg Secondary Background, border 1px Border, radius Medium, min-width 200px
Contents: Label (Caption, Text Secondary), Value (Display size, Text Primary), Trend indicator (Caption, Success or Error colored)

### Organisms (Complex Components)

Windows Overlay Frame: width 380px, height 600px, bg Primary Background, border 1px Border, radius Medium (top corners only), overflow hidden
Auto Layout: vertical, gap 0
Children stack: Status Bar, Response Area (flex grow, scroll), Event Timeline (flex grow, scroll), Action Button Row (fixed 48px), Command Input Bar (fixed 64px)

Dashboard Sidebar: width 240px (expanded) or 64px (collapsed), bg Secondary Background, border-right 1px Border
Auto Layout: vertical, padding 12px
Children: Logo area (48px height), nav items (Icon + Label, height 40px each, hover bg Surface, active bg Accent Subtle with Accent left border 3px), bottom section (settings, docs links)

Dashboard Top Bar: height 56px, bg Secondary Background, border-bottom 1px Border
Contents: Hamburger menu (mobile only), Search input (flex, max-width 400px), Notification bell (Icon Button with dot indicator), User avatar + dropdown (right)

Jobs Table: full width, bg Primary Background
Header row: height 40px, bg Secondary Background, text Caption weight 600
Data rows: Job Row component
Empty state: centered icon + text "No jobs yet" (Text Secondary)

Live View Container: full viewport, bg #000000
Canvas layer: noVNC stream, fill viewport
Control bar layer: absolute top, height 48px, bg rgba(26, 26, 46, 0.8), backdrop blur, auto-hides
Log panel layer: absolute right, width 400px, bg rgba(26, 26, 46, 0.9), slide in/out animation

---

## RESPONSIVE FRAME STRUCTURE

### Frame 1: Windows Overlay (Desktop Only)
Artboard: 380 x 600px
Fixed position simulation (shown as floating panel)
Contains: Status Bar, Response Area, Event Timeline, Action Buttons, Command Input
No responsive variants (fixed desktop overlay)

### Frame 2: Web Dashboard — Desktop (1440px)
Artboard: 1440 x 900px
Layout: Sidebar (240px fixed) + Main Content (flex)
Main Content: Top Bar (56px fixed) + Content Area (scroll)
Content Area pages: Dashboard Home, Jobs History, Profiles, Settings

### Frame 3: Web Dashboard — Tablet (768px)
Artboard: 768 x 1024px
Layout: Collapsed Sidebar (64px, icons only) + Main Content (flex)
Stats cards: 2x2 grid
Tables: reduced columns (hide duration, show essential only)
Job detail: slide-in panel 50% width

### Frame 4: Web Dashboard — Mobile (375px)
Artboard: 375 x 812px
Layout: No sidebar (hamburger menu triggers full-screen nav overlay)
Stats cards: 2x1 stack
Tables: replaced with card list layout
Job detail: full screen overlay
Bottom nav bar: 4 items (Dashboard, Jobs, Live, Settings)

### Frame 5: Live View (1440px)
Artboard: 1440 x 900px
Full viewport stream canvas
Floating control bar (top center, auto-hide)
Slide-in log panel (right, 400px)

### Frame 6: Onboarding Flow (375px mobile-first)
Artboard: 375 x 812px
4 step wizard screens
Step indicator at top
Single column forms
Large touch targets (48px buttons)

---

## INTERACTIVE PROTOTYPE FLOW DEFINITIONS

### Flow 1: First Launch
Welcome Screen → Sign Up → Plan Selection → VPS Setup → API Keys → Overlay Download → First Command Tutorial → Dashboard

### Flow 2: Daily Use (Overlay)
Overlay idle → Type command → Send → Response appears → Events stream in timeline → Job completes → View result

### Flow 3: Live View
Active job in overlay → Click "Live View" button → Browser tab opens → noVNC stream loads → Watch agent work → Toggle log panel → Disconnect when done

### Flow 4: Permission Request
Agent needs file access → Overlay shows Permission Modal → User clicks Allow or Deny → Agent receives result → Continues execution

### Flow 5: Telegram Remote
User sends /run command → Bot confirms job created → User sends /status → Bot returns status with inline buttons → User clicks Kill → Job cancelled, bot confirms

### Flow 6: Wake Word (Phase 4+)
Overlay in idle state (mic indicator subtle pulse) → User says wake word → Overlay activates (accent glow border) → Listening indicator → User speaks command → Command sent → Normal job flow

---

## ASSET AND ICON REQUIREMENTS

### App Icons
CLAW logo: stylized claw mark or talon icon, electric blue on dark background
Sizes needed: 16px (favicon), 32px (tab), 64px (taskbar), 128px (installer), 256px (splash), 512px (store)
Format: SVG master, PNG exports at each size

### UI Icons (Lucide or Phosphor set)
Navigation: home, briefcase, sliders, file, monitor, message-circle, settings, book-open
Actions: send, mic, mic-off, play, pause, square (stop/kill), external-link, copy, x (close), check
Status: circle (dot), activity, alert-triangle, check-circle, x-circle, clock
Events: code, search, terminal, file-text, globe, cpu, zap
System: settings, shield, key, users, log-out, sun, moon

### Illustrations (Optional, for onboarding)
Step 1: Server connection illustration (simple VPS with connection lines)
Step 2: API key illustration (key + shield icon)
Step 3: Desktop overlay illustration (monitor with floating panel)
Step 4: Success illustration (checkmark with sparkles)

Style: flat, minimal, using only the defined color palette. No gradients except subtle accent glow.

---

## ANIMATION SPECIFICATIONS

Transitions:
Default duration: 200ms
Easing: cubic-bezier(0.4, 0, 0.2, 1) (standard material ease)

Panel slide-in: 300ms, ease-out, translate-x from 100% to 0
Modal appear: 200ms, ease-out, opacity 0 to 1 + scale 0.95 to 1
Status dot pulse: 1.5s infinite, opacity 0.5 to 1 to 0.5, for "reconnecting" state
Event timeline new item: 150ms, ease-out, opacity 0 to 1 + translate-y from -8px to 0
Control bar auto-hide: 3 second delay, 300ms fade out, reappears on mouse move
Accent glow on wake word: 500ms ease-in-out, box-shadow pulse 0 to 12px spread to 0

Loading states:
Skeleton: animated gradient sweep left to right, 1.5s infinite
Spinner: 16px or 20px, border 2px Accent, border-top transparent, 0.8s rotation

---

## PROMPT END

Generate all frames, components, and prototype connections as specified above. Use auto-layout on every component and frame. Maintain the exact color tokens, typography, and spacing defined. Create a shared styles library for colors, text styles, and effect styles so all frames stay in sync.

---

END OF SECTION 5: FIGMA MAKE BUILDER PROMPT
