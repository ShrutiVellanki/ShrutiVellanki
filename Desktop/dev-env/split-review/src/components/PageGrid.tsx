import { useRef, useCallback, useMemo, useEffect, useState } from "react"
import { FileWarning, Scissors, GripVertical, ChevronLeft, ChevronRight, Merge } from "lucide-react"
import { useStore } from "../store"
import { CLASSIFICATION_META } from "../types"
import type { Document, Page } from "../types"

function isInRange(pageId: string, range: { startPageId: string; endPageId: string } | null, allPages: Page[]) {
  if (!range) return false
  const si = allPages.findIndex((p) => p.pageId === range.startPageId)
  const ei = allPages.findIndex((p) => p.pageId === range.endPageId)
  const pi = allPages.findIndex((p) => p.pageId === pageId)
  return pi >= Math.min(si, ei) && pi <= Math.max(si, ei)
}

interface FlatItem {
  kind: "page"
  page: Page
  doc: Document
  isFirstInDoc: boolean
  isLastInDoc: boolean
}

interface SplitItem {
  kind: "split"
  prevDoc: Document
  nextDoc: Document
  nextDocIndex: number
}

interface GapItem {
  kind: "gap"
  doc: Document
  afterPage: Page
  beforePage: Page
}

type GridItem = FlatItem | SplitItem | GapItem

function PageThumb({
  page,
  doc,
  isSelected,
  inRange,
  isActiveDoc,
}: {
  page: Page
  doc: Document
  isSelected: boolean
  inRange: boolean
  isActiveDoc: boolean
}) {
  const { dispatch, state } = useStore()
  const meta = CLASSIFICATION_META[doc.classification]
  const [imgError, setImgError] = useState(false)

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.shiftKey) {
        dispatch({ type: "SHIFT_SELECT_PAGE", pageId: page.pageId })
      } else {
        dispatch({ type: "SELECT_PAGE", pageId: page.pageId })
      }
    },
    [dispatch, page.pageId],
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      if (state.rangeSelection && inRange) {
        dispatch({
          type: "OPEN_CONTEXT_MENU",
          menu: {
            x: e.clientX,
            y: e.clientY,
            target: { kind: "range", range: state.rangeSelection, docId: doc.id },
          },
        })
      } else {
        dispatch({
          type: "OPEN_CONTEXT_MENU",
          menu: {
            x: e.clientX,
            y: e.clientY,
            target: { kind: "page", pageId: page.pageId, docId: doc.id },
          },
        })
      }
    },
    [dispatch, page.pageId, doc.id, state.rangeSelection, inRange],
  )

  return (
    <button
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => dispatch({ type: "HOVER_PAGE", pageId: page.pageId })}
      onMouseLeave={() => dispatch({ type: "HOVER_PAGE", pageId: null })}
      className={`relative rounded-lg overflow-hidden transition-all duration-150 outline-none ${
        isSelected
          ? "ring-2 ring-accent ring-offset-2 ring-offset-surface shadow-lg"
          : inRange
            ? "ring-2 ring-accent/40 ring-offset-1 ring-offset-surface"
            : isActiveDoc
              ? "ring-1 ring-border-strong shadow-md"
              : "ring-1 ring-border/50 opacity-50 hover:opacity-80 hover:ring-border"
      }`}
      style={{ width: 120, height: 156 }}
    >
      {imgError ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-surface-sunken text-ink-muted gap-1.5">
          <FileWarning className="w-5 h-5 opacity-40" />
          <span className="text-[9px] font-mono opacity-60">p.{page.originalPageNumber}</span>
        </div>
      ) : (
        <img
          src={page.pageImageUrl}
          alt={`Page ${page.originalPageNumber}`}
          className="w-full h-full object-cover"
          draggable={false}
          onError={() => setImgError(true)}
        />
      )}

      {inRange && (
        <div className="absolute inset-0 bg-accent/10 pointer-events-none" />
      )}

      <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-ink/70 text-white backdrop-blur-sm">
        {page.originalPageNumber}
      </span>

      <span
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: meta.color }}
      />
    </button>
  )
}

function SplitBoundary({ prevDoc, nextDoc }: {
  prevDoc: Document
  nextDoc: Document
}) {
  const { dispatch } = useStore()
  const rootRef = useRef<HTMLDivElement>(null)
  const dragStartX = useRef<number | null>(null)
  const dragAccum = useRef(0)
  const [dragging, setDragging] = useState(false)
  const [active, setActive] = useState(false)
  const [moveCount, setMoveCount] = useState(1)

  const prevMeta = CLASSIFICATION_META[prevDoc.classification]
  const nextMeta = CLASSIFICATION_META[nextDoc.classification]
  const prevLabel = prevDoc.fileName.replace(/\.pdf$/i, "")
  const nextLabel = nextDoc.fileName.replace(/\.pdf$/i, "")

  const moveBoundary = useCallback(
    (delta: number) => dispatch({ type: "MOVE_BOUNDARY", splitAfterDocId: prevDoc.id, delta }),
    [dispatch, prevDoc.id],
  )

  const mergeLeft = useCallback(
    () => dispatch({ type: "REMOVE_SPLIT", docId: nextDoc.id, direction: "left" }),
    [dispatch, nextDoc.id],
  )

  const mergeRight = useCallback(
    () => dispatch({ type: "REMOVE_SPLIT", docId: nextDoc.id, direction: "right" }),
    [dispatch, nextDoc.id],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const key = e.key
      if (key === "ArrowLeft" || key === "ArrowRight") {
        e.preventDefault()
        e.stopPropagation()
        const dir = key === "ArrowLeft" ? -1 : 1
        const count = e.shiftKey ? moveCount : 1
        moveBoundary(dir * count)
      } else if (key === "Backspace") {
        e.preventDefault()
        mergeLeft()
      } else if (key === "Delete") {
        e.preventDefault()
        mergeRight()
      } else if (key >= "1" && key <= "9") {
        setMoveCount(parseInt(key, 10))
      } else if (key === "Escape") {
        rootRef.current?.blur()
      }
    },
    [moveBoundary, mergeLeft, mergeRight, moveCount],
  )

  const totalDragged = useRef(0)

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      dragStartX.current = e.clientX
      dragAccum.current = 0
      totalDragged.current = 0
      setDragging(true)

      function onMove(ev: MouseEvent) {
        if (dragStartX.current === null) return
        const dx = ev.clientX - dragStartX.current
        const steps = Math.round(dx / 130)
        if (steps !== dragAccum.current) {
          const delta = steps - dragAccum.current
          dragAccum.current = steps
          totalDragged.current += Math.abs(delta)
          dispatch({ type: "MOVE_BOUNDARY", splitAfterDocId: prevDoc.id, delta })
        }
      }

      function onUp() {
        dragStartX.current = null
        setDragging(false)
        if (totalDragged.current > 0) {
          setMoveCount(Math.min(99, totalDragged.current))
        }
        window.removeEventListener("mousemove", onMove)
        window.removeEventListener("mouseup", onUp)
      }

      window.addEventListener("mousemove", onMove)
      window.addEventListener("mouseup", onUp)
    },
    [dispatch, prevDoc.id],
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      dispatch({
        type: "OPEN_CONTEXT_MENU",
        menu: { x: e.clientX, y: e.clientY, target: { kind: "split", prevDocId: prevDoc.id, docId: nextDoc.id } },
      })
    },
    [dispatch, prevDoc.id, nextDoc.id],
  )

  const showControls = active || dragging

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      className={`flex flex-col items-center justify-center self-stretch select-none outline-none transition-all duration-150 ${
        showControls ? "bg-accent/5 rounded-lg" : ""
      } focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-surface`}
      style={{ width: showControls ? 88 : 28 }}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => { setActive(false); setMoveCount(1) }}
      onFocus={() => setActive(true)}
      onBlur={() => { setActive(false); setMoveCount(1) }}
      onKeyDown={handleKeyDown}
    >
      <div className={`w-[2px] flex-1 transition-colors ${showControls ? "bg-accent" : "bg-accent/40"}`} />

      {showControls ? (
        <div className="flex flex-col items-center gap-1.5 py-2 w-full px-1">
          {/* Doc labels */}
          <div className="flex items-center gap-1 w-full justify-center">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: prevMeta.color }} />
            <span className="text-[8px] text-ink-muted truncate max-w-[30px]">{prevLabel}</span>
            <span className="text-[8px] text-ink-muted/40">|</span>
            <span className="text-[8px] text-ink-muted truncate max-w-[30px]">{nextLabel}</span>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: nextMeta.color }} />
          </div>

          {/* Move pages — also draggable */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[7px] uppercase tracking-wider text-ink-muted/60 font-semibold">Move</span>
            <div
              className={`flex items-center gap-px cursor-ew-resize rounded px-0.5 ${dragging ? "bg-accent/12" : ""}`}
              onMouseDown={handleDragStart}
              title="Click arrows or drag to move boundary"
            >
              <button
                onClick={(e) => { e.stopPropagation(); moveBoundary(-moveCount) }}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-5 h-5 flex items-center justify-center rounded text-ink-muted hover:text-accent hover:bg-accent/10 transition-colors"
                title={`Move ${moveCount} page${moveCount > 1 ? "s" : ""} ← (←)`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min={1}
                max={99}
                value={moveCount}
                onChange={(e) => setMoveCount(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                className="w-7 h-5 text-center text-[9px] font-mono font-bold bg-surface-raised border border-border rounded text-ink outline-none focus:border-accent cursor-text [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                title="Pages to move (1-9 keys or type)"
              />
              <button
                onClick={(e) => { e.stopPropagation(); moveBoundary(moveCount) }}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-5 h-5 flex items-center justify-center rounded text-ink-muted hover:text-accent hover:bg-accent/10 transition-colors"
                title={`Move ${moveCount} page${moveCount > 1 ? "s" : ""} → (→)`}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Merge */}
          <div className="flex flex-col items-center gap-0.5 w-full">
            <span className="text-[7px] uppercase tracking-wider text-ink-muted/60 font-semibold">Merge</span>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); mergeLeft() }}
                className="w-6 h-6 flex items-center justify-center rounded text-ink-muted hover:text-accent hover:bg-accent/10 transition-colors"
                title={`Merge into "${prevLabel}" (keep left · Backspace)`}
              >
                <Merge className="w-4 h-4" style={{ transform: "rotate(90deg)" }} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); mergeRight() }}
                className="w-6 h-6 flex items-center justify-center rounded text-ink-muted hover:text-accent hover:bg-accent/10 transition-colors"
                title={`Merge into "${nextLabel}" (keep right · Delete)`}
              >
                <Merge className="w-4 h-4" style={{ transform: "rotate(-90deg) scaleX(-1)" }} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-0.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: prevMeta.color }} />
          <GripVertical className="w-3 h-3 text-ink-muted/30" />
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: nextMeta.color }} />
        </div>
      )}

      <div className={`w-[2px] flex-1 transition-colors ${showControls ? "bg-accent" : "bg-accent/40"}`} />
    </div>
  )
}

function SplitGap({ doc, beforePage }: {
  doc: Document
  afterPage: Page
  beforePage: Page
}) {
  const { dispatch } = useStore()
  const [active, setActive] = useState(false)

  const handleSplit = useCallback(() => {
    dispatch({ type: "SPLIT_BEFORE_PAGE", docId: doc.id, pageId: beforePage.pageId })
  }, [dispatch, doc.id, beforePage.pageId])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        handleSplit()
      }
    },
    [handleSplit],
  )

  return (
    <div
      tabIndex={0}
      role="button"
      className="flex flex-col items-center justify-center self-stretch select-none outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-surface rounded"
      style={{ width: active ? 28 : 8 }}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      onClick={handleSplit}
      onKeyDown={handleKeyDown}
      title={`Split here — new doc before p.${beforePage.originalPageNumber} (Enter)`}
    >
      {active ? (
        <div className="flex flex-col items-center justify-center gap-1 h-full w-full rounded-md hover:bg-accent/8 transition-colors">
          <div className="w-[2px] flex-1 bg-accent/30" />
          <div className="w-5 h-5 flex items-center justify-center rounded-full bg-accent/10 text-accent">
            <Scissors className="w-3 h-3" />
          </div>
          <div className="w-[2px] flex-1 bg-accent/30" />
        </div>
      ) : (
        <div className="w-px h-full" />
      )}
    </div>
  )
}

export function PageGrid() {
  const { state, dispatch } = useStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  const flatItems = useMemo<GridItem[]>(() => {
    const items: GridItem[] = []
    const docs = state.bundle.documents
    for (let di = 0; di < docs.length; di++) {
      const doc = docs[di]
      if (di > 0 && docs[di - 1].pages.length > 0 && doc.pages.length > 0) {
        items.push({ kind: "split", prevDoc: docs[di - 1], nextDoc: doc, nextDocIndex: di })
      }
      for (let pi = 0; pi < doc.pages.length; pi++) {
        if (pi > 0) {
          items.push({
            kind: "gap",
            doc,
            afterPage: doc.pages[pi - 1],
            beforePage: doc.pages[pi],
          })
        }
        items.push({
          kind: "page",
          page: doc.pages[pi],
          doc,
          isFirstInDoc: pi === 0,
          isLastInDoc: pi === doc.pages.length - 1,
        })
      }
    }
    return items
  }, [state.bundle.documents])

  const allPages = useMemo(() => state.bundle.documents.flatMap((d) => d.pages), [state.bundle.documents])

  useEffect(() => {
    if (!state.selectedPageId || !scrollRef.current) return
    const el = scrollRef.current.querySelector(`[data-page-id="${state.selectedPageId}"]`)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [state.selectedPageId])

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[13px] font-bold text-ink tracking-tight">Pages</h2>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3"
      >
        <div className="flex flex-wrap gap-y-2.5 items-stretch">
          {flatItems.map((item, i) => {
            if (item.kind === "split") {
              return (
                <SplitBoundary
                  key={`split-${item.nextDocIndex}`}
                  prevDoc={item.prevDoc}
                  nextDoc={item.nextDoc}
                />
              )
            }

            if (item.kind === "gap") {
              return (
                <SplitGap
                  key={`gap-${item.afterPage.pageId}-${item.beforePage.pageId}`}
                  doc={item.doc}
                  afterPage={item.afterPage}
                  beforePage={item.beforePage}
                />
              )
            }

            const isActiveDoc = state.selectedDocId === item.doc.id
            return (
              <div
                key={item.page.pageId}
                data-page-id={item.page.pageId}
                className="flex items-start"
              >
                <PageThumb
                  page={item.page}
                  doc={item.doc}
                  isSelected={state.selectedPageId === item.page.pageId}
                  inRange={isInRange(item.page.pageId, state.rangeSelection, allPages)}
                  isActiveDoc={isActiveDoc}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
