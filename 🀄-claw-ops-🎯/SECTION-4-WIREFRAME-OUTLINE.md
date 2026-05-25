# CLAW — RESPONSIVE WIREFRAME OUTLINE
## Tool-Agnostic Component Specifications
### Desktop, Tablet, and Mobile Responsive

---

## VIEW 1: USER ONBOARDING FLOW (SaaS Phase)

### Screen 1.1: Welcome / Sign Up
Layout: Centered card, max-width 480px
Components:
- Logo and product name header
- Tagline: "Your AI, always on."
- Email input field
- Password input field (with show/hide toggle)
- "Create Account" primary button
- "Already have an account? Sign in" link
- OAuth options: Google, GitHub (future)

### Screen 1.2: Plan Selection
Layout: 3-column card grid (stacks vertically on mobile)
Components:
- FREE tier card: feature list, "Start Free" button
- PRO tier card: feature list, price, "Start Pro" button (highlighted)
- POWER tier card: feature list, price, "Start Power" button
- "Compare plans" expandable section below cards

### Screen 1.3: VPS Connection Setup
Layout: Single column, step indicator at top
Components:
- Step indicator: 1 of 4 active
- Instruction text: "Connect your VPS"
- Option A: "I have my own VPS" with SSH connection form (host, port, SSH key upload)
- Option B: "Set one up for me" (managed hosting, future)
- Test connection button with status indicator (loading/success/error)
- "Next" button (disabled until connection verified)

### Screen 1.4: API Key Configuration
Layout: Single column, step indicator at top
Components:
- Step indicator: 2 of 4 active
- Model provider cards (OpenAI, Anthropic, Google, Ollama)
- Each card: provider name, API key input (masked), "Verify" button, status badge
- At least one provider must be verified to continue
- "Next" button

### Screen 1.5: Overlay Download
Layout: Single column, step indicator at top
Components:
- Step indicator: 3 of 4 active
- Platform detection: "We detected Windows 11"
- Download button for Electron overlay installer
- Installation instructions (collapsible)
- "I've installed it" confirmation button

### Screen 1.6: First Command Tutorial
Layout: Single column, step indicator at top
Components:
- Step indicator: 4 of 4 active
- Interactive tutorial overlay showing the command input
- Pre-filled example command: "Summarize the latest AI news"
- "Send" button
- Live event timeline showing agent steps in real time
- Success confirmation with confetti animation
- "You're ready! Open Dashboard" button

---

## VIEW 2: CENTRAL DASHBOARD (Web, SaaS Phase)

### Layout Structure
- Left sidebar: navigation (collapsible on tablet, hamburger on mobile)
- Main content area: fills remaining width
- Top bar: search, notifications, user menu

### Sidebar Navigation
- Dashboard (home)
- Jobs (history)
- Profiles (model routing)
- Files (uploaded files)
- Live View (active sessions)
- Telegram (bot settings)
- Settings
- Docs (external link)

### Dashboard Home
Components:
- Stats row: Jobs Today, Success Rate, Avg Latency, Active Jobs (4 cards, 2x2 on mobile)
- Recent Jobs table: job ID, profile, status badge, duration, timestamp, actions (view, cancel)
- Active Job panel (if any): live event stream, response preview, kill button
- Quick Command input at bottom (persistent, like a chat input)

### Jobs History View
Components:
- Filter bar: date range, profile dropdown, status dropdown, search
- Jobs table: sortable columns (ID, profile, status, duration, created_at)
- Row click opens job detail panel (slide-in from right or full page on mobile)
- Job detail: full event timeline, response text, files used, cost estimate

### Profiles View
Components:
- Profile cards in grid layout
- Each card: profile name, provider, model, token cap, cost cap, edit button
- "Add Profile" button
- Edit modal: form with all profile fields, save/cancel buttons

---

## VIEW 3: WINDOWS OVERLAY (Desktop Only)

### Layout: Vertical Strip
Default: 380px wide, 600px tall, docked right edge
Resizable: min 320px wide, min 400px tall

### Component Stack (top to bottom):

#### 3.1 Status Bar (40px height)
- Left: Connection dot (green/yellow/red) + "Connected" text
- Center: Current profile name badge
- Right: Settings gear icon

#### 3.2 Response Area (flexible height, 40% of space)
- Scrollable container
- Latest AI response displayed with markdown rendering
- Code blocks with copy button
- Timestamps on each response
- Clear history button (top-right of section)

#### 3.3 Event Timeline (flexible height, 30% of space)
- Scrollable list of events
- Each event: icon (type-specific), short description, timestamp
- Color coded: blue for steps, green for results, red for errors, gray for system
- Auto-scrolls to latest event
- Click event to expand details

#### 3.4 Action Buttons (48px height)
- Row of buttons, equal width
- "Live View" button (opens browser tab) - accent color
- "Pause" button - warning color
- "Kill" button - error color
- All buttons disabled when no active job

#### 3.5 Command Input (64px height)
- Text input field with placeholder: "Type a command..."
- Mic icon button on right (toggles voice capture)
- Send button (arrow icon)
- Profile selector dropdown above input (small, unobtrusive)

#### 3.6 Permission Modal (overlay, centered)
- Semi-transparent dark backdrop
- White card with:
  - Warning icon
  - "Allow agent to read [filename]?"
  - File path displayed
  - "Allow" button (accent)
  - "Deny" button (gray)
  - "Always deny for this session" checkbox

---

## VIEW 4: LIVE VIEW (Browser Tab)

### Layout: Full Viewport

#### 4.1 Stream Canvas (full background)
- noVNC remote desktop stream
- Fills entire viewport
- Cursor visible and tracked
- Scales to fit window while maintaining aspect ratio

#### 4.2 Control Bar (top, auto-hides after 3 seconds)
- Left: Connection status badge (Connected/Reconnecting/Disconnected)
- Center: Job ID and profile name
- Right: Log toggle button, Disconnect button

#### 4.3 Log Overlay Panel (right side, toggleable)
- Width: 400px (slides in/out)
- Semi-transparent dark background (rgba(26, 26, 46, 0.9))
- Scrollable event log matching overlay timeline format
- Close button (X) at top-right

---

## VIEW 5: TELEGRAM INTERFACE (Text-Based)

### Command Responses Format

/run response:
```
Job created: job_xxx
Profile: default_fast
Status: queued
[Pause] [Kill] [Status]
```

/status response:
```
Active Jobs: 2

job_001 | dev_deep | running | 2m 15s
job_002 | default_fast | queued | waiting

[Kill job_001] [Kill job_002]
```

/stream response:
```
Live stream for job_001:
> agent.step: Analyzing request...
> tool.called: web_search("latest AI news")
> tool.result: Found 5 results
> agent.step: Summarizing findings...
```

---

## VIEW 6: SETTINGS (Overlay + Web Dashboard)

### Settings Categories

#### General
- Theme: Dark (default), Light (future)
- Overlay opacity: slider 20% to 100%
- Overlay position: Left, Right, Float
- Auto-start with Windows: toggle
- Minimize to system tray: toggle

#### Model Profiles
- List of profiles with edit/delete
- Add new profile form
- Test profile button (sends test prompt)

#### Wake Word (Phase 4+)
- Enable/disable toggle
- Sensitivity slider
- Wake word selection (if custom words supported)
- Test button (shows listening indicator)

#### Security
- View/regenerate API key
- Telegram bot settings (user allowlist, PIN management)
- File permission log (history of allowed/denied)
- Clear session data button

#### About
- Version number
- Check for updates button
- Links to docs, changelog, support

---

## RESPONSIVE BREAKPOINTS AND COMPONENT SPECIFICATIONS

### Breakpoints (for web dashboard, future)

Mobile (320px to 767px):
- Single column layout
- Sidebar hidden, accessible via hamburger menu
- Stats cards stack 2x2
- Tables become card lists
- Job detail opens full screen
- Action buttons stack vertically

Tablet (768px to 1023px):
- Sidebar collapsed to icons
- Stats cards in 2x2 grid
- Tables show reduced columns
- Job detail opens as slide-in panel (50% width)

Desktop (1024px to 1439px):
- Sidebar expanded with labels
- Stats cards in single row (4 across)
- Full table with all columns
- Job detail in slide-in panel (40% width)

Wide (1440px+):
- Same as desktop with max-width container (1400px)
- Extra whitespace distributed evenly

### Component Size Specifications

Buttons:
- Primary: height 40px, padding 12px 24px, border-radius 4px
- Secondary: height 36px, padding 8px 16px, border-radius 4px
- Icon button: 36px x 36px, border-radius 50%
- Minimum touch target: 44px x 44px

Inputs:
- Height: 40px
- Padding: 8px 12px
- Border: 1px solid #2a2a4a
- Focus border: 2px solid #00d4ff
- Border-radius: 4px

Cards:
- Padding: 16px
- Border-radius: 8px
- Background: #16213e
- Border: 1px solid #2a2a4a
- Shadow: none (flat design for dark theme)

Tables:
- Row height: 48px
- Header: bold, background #16213e
- Alternating row colors: #1a1a2e / #1e1e36
- Hover: #222240

Modals:
- Max-width: 480px
- Padding: 24px
- Border-radius: 12px
- Backdrop: rgba(0, 0, 0, 0.7)

Status Badges:
- Height: 24px
- Padding: 4px 8px
- Border-radius: 12px (pill shape)
- Font size: 12px
- Colors: green for success/running, blue for queued, red for error, gray for cancelled

---

END OF SECTION 4: RESPONSIVE WIREFRAME OUTLINE
