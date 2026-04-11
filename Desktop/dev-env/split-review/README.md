# Split Review — Design Decisions

A document split correction tool for accountants reviewing API-generated page splits of tax document bundles. Built for high-net-worth individual tax preparation workflows.

## How to run

```bash
npm install
npm run dev
```

Opens at `http://localhost:5180`. Best viewed on a 30-inch monitor at 2560×1440 or higher.

## Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS v4
- Lucide icons
- No component library — all UI is custom

---

## Key assumptions (confirmed with stakeholder)

- **All pages must be visible.** Accountants need to see every page to validate that the LLM didn't accidentally combine multiple documents into one. No collapsing or hiding middle pages.
- **Sequential review.** Accountants go through documents in order, top to bottom. They don't jump around the bundle. The UI should optimize for "check this boundary, move to the next" as the primary workflow.
- **Document order is fixed.** The AI-generated document order stays — accountants only need to create and delete documents, not rearrange them.
- **Mixed keyboard comfort.** Some accountants are heavy keyboard users, others are not. Mouse-first interactions (context menus, drag, click) are primary; keyboard shortcuts are an acceleration layer, not a requirement.

---

## Design Choices

### 1. Optimized for 30-inch monitors

The entire layout assumes a large, high-resolution display. No responsive breakpoints, no mobile considerations. The three-panel layout (272px sidebar + fluid center + 480px preview) is designed to fill a wide viewport, giving the accountant maximum simultaneous visibility of documents, pages, and page content.

The page grid in the center pane can show 8–12 thumbnails per row at 2560px width, meaning the accountant sees 40–60 pages at once — enough to survey an entire small bundle or a significant portion of a large one without scrolling.

**Why:** The requirements explicitly stated a 30-inch monitor and no responsive needs. Designing for one viewport means every pixel is intentional rather than compromised by breakpoint logic.

### 2. Single view — no modals, no routing, no multi-step flows

Everything happens in one screen. Document list, page grid, preview, metadata editing, split operations, save — all visible and accessible simultaneously. There are no modal dialogs, no separate "edit" screens, no wizard flows.

Metadata fields are always-visible inputs in the sidebar (not double-click-to-edit). The accountant clicks a field and types. Tab moves between fields. No mode switching.

**Why:** The top priority was frictionless UX. Every modal is a context switch. Every separate screen is a mental bookmark the user has to maintain. Keeping everything in one view means the accountant's eyes never have to re-orient.

### 3. Contiguous page assumption drives the interaction model

Pages within a document are always contiguous (e.g., pages 1–5 then 6–12, never pages 1, 3, 7). This constraint dramatically simplifies the interaction model: all split operations reduce to placing, moving, or removing boundary markers between adjacent pages.

There is no drag-and-drop of individual pages between documents — it would violate contiguity. Instead, boundaries shift (moving pages in bulk between adjacent docs), and ranges can be extracted as new documents atomically.

**Why:** The API produces contiguous splits by definition. Honoring this constraint in the UI prevents invalid states and reduces the interaction surface. Moving a boundary is one gesture; moving N individual pages is N gestures.

### 4. Context menus as the primary action surface

All split, merge, and structural operations live in right-click context menus — not in persistent buttons cluttering the UI. The page grid stays visually clean: just thumbnails, classification colors, and boundary lines.

Context menus are target-aware:
- **Right-click a page** → split before, split after
- **Right-click a selected range** → create document from range
- **Right-click a split line** → remove split (merge)
- **Right-click a document header** → merge up/down, delete empty

**Why:** Accountants are spreadsheet power users — right-click context menus are deeply ingrained muscle memory from Excel. Context menus surface relevant actions without permanent UI chrome, keeping the visual focus on the pages themselves.

### Split-created documents inherit parent identity

When a document is split, both resulting documents inherit the parent's filename and name with page range suffixes appended. For example, splitting `1099-COMP_001.pdf` ("Consolidated 1099") at page 30 produces:
- `1099-COMP_001_p1-29.pdf` — "Consolidated 1099 (p.1–29)"
- `1099-COMP_001_p30-62.pdf` — "Consolidated 1099 (p.30–62)"

Both children also inherit the parent's classification and description. This applies to all split operations: split-before-page and create-document-from-range.

**Why:** Generic names like `split_42.pdf` / "New Document" force the accountant to immediately rename every split result — friction during the exact moment they're focused on boundary correction. Carrying forward the parent's identity preserves context: the accountant can see at a glance that both halves came from the same original consolidated 1099 from Morgan Stanley, and the page ranges make it obvious which half is which. The names and filenames are still fully editable if the accountant wants to rename them after the fact.

### Keyboard shortcuts are an acceleration layer, not a requirement

Every action in the tool — split, merge, move boundary, navigate, save — can be performed entirely with the mouse via context menus, hover markers, sidebar buttons, and click targets. Keyboard shortcuts exist as a parallel path for accountants who prefer them, but they duplicate mouse functionality rather than replacing it.

The full keyboard surface:

| Shortcut | Action | Mouse equivalent |
|---|---|---|
| `←` `→` | Navigate pages | Click any thumbnail |
| `[` `]` | Navigate documents | Click sidebar doc / Prev/Next buttons |
| `S` | Split before selected page | Right-click → "Split here" / hover scissors |
| `⇧+⌫` | Merge, keep left document | Merge ← button on boundary / context menu |
| `⇧+⌦` | Merge, keep right document | Merge → button on boundary / context menu |
| `1`–`9` | Set boundary move step | Numeric input on boundary marker |
| `⇧+←` `⇧+→` | Move boundary by step | ← / → arrows on boundary marker / drag |
| `⌘/⌃+S` | Save | Save button in top bar |

The step multiplier (`1`–`9`) persists until changed, so pressing `5` then `⇧+→` repeatedly moves 5 pages at a time. The current step is shown in the keyboard shortcut bar.

**Why secondary:** Stakeholder interviews confirmed mixed keyboard comfort levels among accountants. Some are Excel power users with strong shortcut habits; others are mouse-primary. Making keyboard the only path would exclude the latter group. Making it a secondary acceleration layer means keyboard-heavy users get speed without forcing a learning curve on mouse-primary users. The keyboard shortcut bar at the bottom of the screen is the only persistent indicator — visible enough to discover, unobtrusive enough to ignore.

### No standalone "New Document" button

There is no button to create an empty document. New documents are only created as a side effect of splitting — either "split before/after" on a page or "create document from range." This is intentional: every new document starts with pages already assigned, eliminating the "create then populate" two-step flow and preventing orphaned empty documents that would block saving.

**Why:** An empty document can't be saved (backend requires every document to have pages). Creating empty documents adds a cleanup burden — the accountant has to remember to delete them or move pages into them before saving. Since every document creation in this workflow is really a boundary adjustment, tying creation to the split action ensures the result is always valid.

### 5. Range selection for multi-split operations

Click a page, then Shift-click another to select a contiguous range. Right-click the range to create a new document from those pages. This performs two splits atomically — the selected range becomes a new document, and the surrounding pages remain in their original documents.

**Why:** Without range selection, extracting pages 15–20 from an 80-page document requires two separate split operations with an intermediate invalid state between them. Range selection makes it one gesture: select the pages you mean, then tell the app what to do with them.

### 6. Split and merge — create and remove boundaries inline

Between every pair of adjacent pages within a document, hovering reveals a narrow split marker with a scissors icon. Clicking it inserts a new document boundary at that point — the pages before become one document, the pages after become another. Existing boundaries between documents show as vertical accent lines with color dots for each side; hovering reveals an `×` button that merges the two documents back into one. Right-clicking a page also offers "Split here" in the context menu.

**Why this instead of click-to-move arrows?** The previous design let you nudge boundaries ±1 page, but the core operation is "this boundary is wrong, put it here instead." That's a delete-old-boundary + create-new-boundary, not a series of single-page nudges. Direct placement is faster and more intentional — one click to split, one click to merge. The interaction model is now: **scissors to split, × to merge.** No ambiguity about direction or magnitude.

**Hover-to-reveal keeps the grid clean.** The split markers are invisible at rest (just a 1px gap), expanding to 28px with the scissors icon on hover. This avoids cluttering a 300-page grid with 299 visible buttons while still making every possible split point one hover + click away.

### 7. Flat continuous page grid

All pages from the entire bundle flow in one wrapping grid — no per-document blocks, no headers breaking the flow. Pages belonging to the selected document appear at full opacity with stronger borders; unselected documents' pages are dimmed to 50%. Split boundaries sit inline between the last page of one document and the first page of the next.

**Why flat instead of bucketed?** A bucketed layout (separate grids per document) breaks the visual continuity at document boundaries — exactly the place the accountant needs to scrutinize most. A flat grid lets the accountant see pages from adjacent documents side by side, making boundary errors immediately visible. The dimming provides enough visual grouping without physical separation.

**Why no collapsing:** Accountants confirmed they need to see all pages to catch cases where the LLM combined multiple documents into one. Hiding middle pages would undermine the core verification task. Even for 80-page documents, the grid keeps individual thumbnails small enough that the full document is surveyable.

### 8. Classification color coding

Each document classification (wages, brokerage, interest, etc.) has a distinct color. This appears as:
- A 3px colored bar at the top of each page thumbnail
- A colored dot next to document names in the sidebar and grid
- A tinted background on the active document's page block

**Why:** Tax bundles contain many document types. Color coding lets the accountant spot patterns and anomalies spatially — "there's a green (brokerage) page sitting in the middle of blue (interest) pages" — without reading labels.

### 9. Sequential document navigation

The sidebar includes Prev/Next buttons showing position (e.g., "3 / 12"), and `[` / `]` keyboard shortcuts navigate between documents. Selecting a new document auto-scrolls both the sidebar and the page grid to that document's block.

**Why:** Accountants confirmed they review documents sequentially — top to bottom through the bundle. The navigation controls optimize the "check this boundary, move to the next" loop. The position indicator (`3 / 12`) gives a sense of progress through the bundle. Auto-scrolling both panels keeps the sidebar and grid in sync without manual scrolling.


### 10. Preview panel with hover-to-preview and drag-to-pan

The right panel shows a full-size page (612×792) with zoom controls. Hovering any thumbnail in the grid immediately updates the preview — no click required. The preview viewport is draggable: click and drag to pan when zoomed in, with a reset button appearing when panned. Ctrl/Cmd+scroll zooms directly in the viewport.

**Why:** The requirements specified "high confidence in seeing things important" — click alone wasn't considered sufficient. Hover-to-preview lets the accountant sweep across thumbnails and see each one at full resolution instantly. Clicking locks the selection; hovering is for scanning. Drag-to-pan is essential because at higher zoom levels (200%+), the page overflows the viewport. Without panning, the accountant can only see the center — they'd miss header info, TINs, account numbers, and footnotes. The grab cursor communicates the affordance immediately.

### 11. Page strip for direct page navigation

The bottom of the preview panel shows a horizontal strip of clickable page number pills — one per page in the current document. The active page is highlighted in accent color, and the strip auto-scrolls to keep the active page centered. For a 62-page brokerage statement, the strip scrolls horizontally with arrow buttons on each end. Each pill shows the original bundle page number, not the 1-indexed position within the document.

**Why:** Prev/Next buttons work for stepping through pages, but they're O(n) — reaching page 45 of 62 takes 44 clicks. The page strip makes every page a single click away. Showing original page numbers (not doc-relative indices) lets accountants cross-reference with the page grid, where thumbnails also show original numbers. For small documents (2–3 pages), the strip shows all pages at once with no scrolling needed.

### 12. Download button shows the current document

The download button in the top bar displays the selected document's filename and classification color dot, not a generic "Download" label. When no document is selected, it shows "Select a doc to download" as a hint. Clicking triggers a toast confirming the filename and page count.

**Why:** A generic "Download" button is ambiguous in a tool that shows 64 documents simultaneously. Showing the filename directly in the button eliminates the question "which document will this download?" The classification color dot provides a secondary visual confirmation, matching the color coding used everywhere else in the UI.

### 13. Save validation — no orphaned pages, no empty documents

The save button is blocked if any documents are empty or if page counts don't match the original bundle total. Empty documents can be created (as temporary containers during split operations) but cannot be persisted.

**Why:** The backend POST requires every page assigned to a document and no empty documents. Enforcing this in the UI prevents round-trip validation errors and gives the accountant clear feedback about what needs fixing before they can save.

### 14. Ghost split indicator on hover

When hovering between two pages within a document, a subtle accent-colored vertical line appears on the left edge of the page — previewing where a split would occur if you double-click. The grid doesn't reflow until you commit.

**Why:** Split operations are destructive (they create new documents). Previewing the split point before committing reduces anxiety and accidental splits. The accountant sees exactly what will happen without committing.

---

## Affordances & Discoverability

The tool uses several interaction patterns (context menus, drag handles, double-click splits, Shift-click range selection) that are powerful but not self-evident. This is an intentional trade-off: keeping the grid visually clean means the actions can't all be persistent buttons. Discoverability is handled through layered hints rather than upfront tutorials.

### How users discover what's possible

| Affordance | How it's surfaced | Discovery moment |
|---|---|---|
| **Hover-to-split markers** | Hovering the gap between any two pages within a document reveals a scissors icon. One click creates a new document boundary. Invisible at rest to keep the grid clean. | First time they hover between two pages |
| **× to merge** | Existing split boundaries show an `×` button on hover. One click merges the two documents. Right-click also offers "Remove split." | First time they hover an existing boundary |
| **Right-click "Split here"** | Right-click any page for a "Split here" menu option. Shows the original page number so the accountant knows exactly where the cut lands. | First time they right-click a page |
| **Double-click to split** | Hint text in the Pages header ("Double-click gap to split"). Ghost split indicator appears on hover between pages, previewing the action before they commit. | First time they hover between two pages within a document |
| **Shift-click range selection** | Hint text in the Pages header ("Shift-click range"). Blue highlight extends across the range as they Shift-click, giving immediate visual feedback. | First time they need to extract a span of pages |
| **Keyboard shortcuts** | Dedicated bottom bar showing all shortcuts (navigation, split, merge, move with step multiplier, save). Every keyboard action has a mouse equivalent — shortcuts are acceleration, not requirement. Step multiplier (`1`–`9`) shown inline when active. | Visible at all times, zero effort to find |
| **Hover-to-preview** | Preview panel updates instantly as the cursor moves over thumbnails. No instruction needed — the behavior is self-revealing. | First time they move the mouse across the grid |
| **Sequential doc navigation** | Prev/Next buttons with position counter (`3 / 64`) in the sidebar. Explicit and always visible. | Immediately on load |
| **Page strip navigation** | Horizontal strip of page number pills at the bottom of the preview panel. Active page highlighted. Directly clickable. | First time they look at the preview footer |
| **Drag-to-pan preview** | Grab cursor on the preview viewport. Drag to pan when zoomed. Reset button appears when panned. Ctrl+scroll to zoom. | First time they zoom in and try to see another part of the page |
| **Contextual download** | Download button shows the selected document's filename and color dot — not a generic label. Changes when selection changes. | First time they look at the top bar with a doc selected |

### Discoverability philosophy

The tool optimizes for **low floor, high ceiling**: a new user can click through documents in the sidebar, see pages, and edit metadata without learning anything. The power features (splits, range selection, drag boundaries) reveal themselves progressively through hover states, ghost indicators, and contextual hints.

No onboarding modal. No tooltip tour. The hint bar in the Pages header is the only static instruction surface. Everything else is revealed by interacting — hover a split line and see the grip handle, hover between pages and see the ghost indicator, right-click and see the menu.

This works because the core verification task (look at pages, check boundaries) requires no special interaction knowledge at all. The editing features only matter when something needs fixing, and by that point the user is actively looking for a way to act — which is when context menus, hover affordances, and hint text do their job.

---

## Future considerations discussed but not yet implemented

- **Reviewed-state tracking** — dimming documents after the accountant moves past them. Removed in current build because it conflates "navigated past" with "actually verified," but could return as an explicit toggle.
- **Anomaly highlighting** — flag pages whose classification color doesn't match the surrounding document's classification. Directly supports the "LLM combined two docs" detection that accountants confirmed as the primary review task.
- **Minimap in preview panel** — a small overview rectangle in the corner of the preview viewport showing the current pan position relative to the full page. Useful at high zoom levels to maintain spatial orientation.

---

## Agent skills used

This project was built with the help of these [Cursor agent skills](https://docs.cursor.com/context/skills):

| Skill | What it did |
|---|---|
| **frontend-design** | Design system foundation — color tokens, typography scale, spacing rhythm, and the "no generic AI aesthetics" constraint that pushed the UI toward a deliberately opinionated look. |
| **webapp-testing** | Playwright-based screenshot automation for verifying layout, interaction states, and visual regressions across the 300-page mock bundle. |
| **pdf** | Informed the jsPDF integration for rendering SVG page images into downloadable multi-page PDFs. |
| **theme-factory** | Token architecture for the Tailwind v4 theme — surface/ink/accent/border semantic palette, consistent with the design skill's output. |

---

## Project structure

```
split-review/
├── .agents/skills/               # Agent skills used during development
│   ├── frontend-design/SKILL.md  #   Design system & UI quality guidelines
│   ├── pdf/                      #   PDF generation reference + helper scripts
│   │   ├── SKILL.md
│   │   ├── reference.md
│   │   ├── forms.md
│   │   └── scripts/              #   Python utilities (form extraction, validation, etc.)
│   ├── theme-factory/            #   Semantic token architecture + 10 preset themes
│   │   ├── SKILL.md
│   │   └── themes/               #   Pre-built color/font theme definitions
│   └── webapp-testing/           #   Playwright screenshot & browser automation
│       ├── SKILL.md
│       ├── scripts/with_server.py
│       └── examples/             #   Element discovery, console logging, etc.
│
├── src/
│   ├── types.ts                  # TypeScript types, classification metadata
│   ├── store.ts                  # useReducer state management
│   ├── App.tsx                   # Root layout, keyboard shortcuts
│   ├── index.css                 # Tailwind theme tokens
│   ├── data/
│   │   └── mock-data.ts          # 300-page mock tax bundle (64 docs, 9 with 8+ pages)
│   ├── utils/
│   │   └── download-pdf.ts       # jsPDF: renders SVG pages → real multi-page PDF download
│   └── components/
│       ├── DocumentList.tsx      # Sidebar: doc list + inline metadata editing
│       ├── PageGrid.tsx          # Center: page thumbnails, splits, range selection
│       ├── PagePreview.tsx       # Right: full-size page viewer with zoom, pan, page strip
│       ├── ContextMenu.tsx       # Right-click menus (page, range, split, doc)
│       ├── TopBar.tsx            # Header: stats, download (PDF), save
│       └── Toast.tsx             # Notification toasts
│
└── package.json                  # React 19, jsPDF, Vite 6, Tailwind v4
```
