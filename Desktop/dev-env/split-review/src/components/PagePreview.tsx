import { useMemo, useState, useRef, useEffect, useCallback } from "react"
import { ZoomIn, ZoomOut, Maximize, ChevronLeft, ChevronRight, Move, FileWarning } from "lucide-react"
import { useStore } from "../store"
import { CLASSIFICATION_META } from "../types"
import type { Page } from "../types"

function PreviewToolbar({
  pages,
  currentIndex,
  onSelect,
  zoom,
  onZoomIn,
  onZoomOut,
  onFit,
}: {
  pages: Page[]
  currentIndex: number
  onSelect: (index: number) => void
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
}) {
  const currentOrigPage = pages[currentIndex]?.originalPageNumber ?? 0
  const [inputValue, setInputValue] = useState(String(currentOrigPage))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setInputValue(String(pages[currentIndex]?.originalPageNumber ?? ""))
    }
  }, [currentIndex, pages])

  function commit() {
    const n = parseInt(inputValue, 10)
    const idx = pages.findIndex((p) => p.originalPageNumber === n)
    if (idx >= 0) {
      onSelect(idx)
    }
    setInputValue(String(pages[currentIndex]?.originalPageNumber ?? ""))
  }

  const firstOrig = pages[0]?.originalPageNumber
  const lastOrig = pages[pages.length - 1]?.originalPageNumber
  const multiPage = pages.length > 1

  return (
    <div className="flex items-center justify-between px-3 py-1.5">
      {/* Page navigation */}
      <div className="flex items-center gap-1">
        {multiPage && (
          <button
            onClick={() => onSelect(Math.max(0, currentIndex - 1))}
            disabled={currentIndex <= 0}
            className="p-1 rounded hover:bg-surface-overlay text-ink-muted hover:text-ink disabled:opacity-25 disabled:pointer-events-none transition-colors shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
        <div className="flex items-center gap-1 text-[11px] font-mono text-ink-muted">
          <span className="text-ink-muted/60">p.</span>
          {multiPage ? (
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") { commit(); inputRef.current?.blur() }
                if (e.key === "Escape") { setInputValue(String(currentOrigPage)); inputRef.current?.blur() }
              }}
              onFocus={() => inputRef.current?.select()}
              className="w-10 h-6 text-center rounded border border-border bg-surface-raised text-[11px] font-mono text-ink outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus/30 transition-colors"
            />
          ) : (
            <span>{firstOrig}</span>
          )}
          <span className="text-ink-muted/50 text-[10px]">
            {multiPage ? `/ ${firstOrig}–${lastOrig}` : "· 1 pg"}
          </span>
        </div>
        {multiPage && (
          <button
            onClick={() => onSelect(Math.min(pages.length - 1, currentIndex + 1))}
            disabled={currentIndex >= pages.length - 1}
            className="p-1 rounded hover:bg-surface-overlay text-ink-muted hover:text-ink disabled:opacity-25 disabled:pointer-events-none transition-colors shrink-0"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Zoom controls */}
      <div className="flex items-center gap-0.5">
        <button onClick={onZoomOut} className="p-1 rounded hover:bg-surface-overlay text-ink-muted hover:text-ink transition-colors">
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-mono text-ink-muted w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={onZoomIn} className="p-1 rounded hover:bg-surface-overlay text-ink-muted hover:text-ink transition-colors">
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onFit}
          className="p-1 rounded hover:bg-surface-overlay text-ink-muted hover:text-ink transition-colors ml-0.5"
          title="Fit to page"
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export function PagePreview() {
  const { state, dispatch } = useStore()
  const [previewImgError, setPreviewImgError] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const viewportRef = useRef<HTMLDivElement>(null)

  const resetPan = useCallback(() => setPan({ x: 0, y: 0 }), [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      setZoom((z) => Math.min(5, Math.max(0.25, z - e.deltaY * 0.005)))
    }
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    isPanning.current = true
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [pan])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning.current) return
    setPan({
      x: panStart.current.panX + (e.clientX - panStart.current.x),
      y: panStart.current.panY + (e.clientY - panStart.current.y),
    })
  }, [])

  const handlePointerUp = useCallback(() => {
    isPanning.current = false
  }, [])

  const { doc, page, pageIndex } = useMemo(() => {
    const d = state.bundle.documents.find((d) => d.id === state.selectedDocId)
    if (!d) return { doc: null, page: null, pageIndex: -1 }
    const previewId = state.hoveredPageId ?? state.selectedPageId
    const idx = d.pages.findIndex((p) => p.pageId === previewId)
    return {
      doc: d,
      page: idx >= 0 ? d.pages[idx] : d.pages[0] ?? null,
      pageIndex: idx >= 0 ? idx : 0,
    }
  }, [state])

  if (!doc || !page) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-ink-muted">
        <p className="text-[13px]">Select a page to preview</p>
      </div>
    )
  }

  useEffect(() => { resetPan(); setPreviewImgError(false) }, [page?.pageId, resetPan])

  const meta = CLASSIFICATION_META[doc.classification]

  function jumpTo(index: number) {
    if (!doc) return
    if (index >= 0 && index < doc.pages.length) {
      dispatch({ type: "SELECT_PAGE", pageId: doc.pages[index].pageId })
    }
  }

  const fitToPage = useCallback(() => {
    if (!viewportRef.current) return
    const rect = viewportRef.current.getBoundingClientRect()
    const padding = 32
    const scaleX = (rect.width - padding) / 612
    const scaleY = (rect.height - padding) / 792
    setZoom(Math.min(scaleX, scaleY, 3))
    resetPan()
  }, [resetPan])

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border space-y-1.5">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-bold text-ink tracking-tight">Preview</h2>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />
          <span
            className="px-1.5 py-0.5 rounded font-semibold text-[10px] shrink-0"
            style={{ background: meta.color + "18", color: meta.color }}
          >
            {meta.shortLabel}
          </span>
          <span className="text-ink-secondary font-medium truncate">{meta.label}</span>
        </div>
        <div className="text-[11px] text-ink font-medium font-mono truncate">{doc.fileName}</div>
        {doc.name && doc.name !== "New Document" && (
          <div className="text-[11px] text-ink-secondary truncate">{doc.name}</div>
        )}
        {doc.shortDescription && (
          <p className="text-[10px] text-ink-muted leading-relaxed line-clamp-2">{doc.shortDescription}</p>
        )}
      </div>

      <div
        ref={viewportRef}
        className="flex-1 overflow-hidden bg-surface-sunken flex items-center justify-center relative select-none"
        style={{ cursor: isPanning.current ? "grabbing" : "grab" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      >
        <div
          className="shadow-xl rounded-lg overflow-hidden bg-white"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isPanning.current ? "none" : "transform 0.15s ease-out",
          }}
        >
          {previewImgError ? (
            <div
              className="flex flex-col items-center justify-center bg-surface-sunken text-ink-muted gap-3"
              style={{ width: 612, height: 792 }}
            >
              <FileWarning className="w-10 h-10 opacity-30" />
              <span className="text-[13px] font-mono opacity-50">Page {page.originalPageNumber}</span>
              <span className="text-[11px] opacity-40">Image failed to load</span>
            </div>
          ) : (
            <img
              src={page.pageImageUrl}
              alt={`Page ${page.originalPageNumber}`}
              className="block pointer-events-none"
              style={{ width: 612, height: 792 }}
              draggable={false}
              onError={() => setPreviewImgError(true)}
            />
          )}
        </div>
        {(pan.x !== 0 || pan.y !== 0) && (
          <button
            onClick={(e) => { e.stopPropagation(); resetPan() }}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-surface-raised/90 border border-border text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors backdrop-blur-sm"
            title="Reset position"
          >
            <Move className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="border-t border-border">
        <PreviewToolbar
          pages={doc.pages}
          currentIndex={pageIndex}
          onSelect={jumpTo}
          zoom={zoom}
          onZoomIn={() => setZoom((z) => Math.min(3, z + 0.25))}
          onZoomOut={() => setZoom((z) => Math.max(0.25, z - 0.25))}
          onFit={fitToPage}
        />
      </div>
    </div>
  )
}
