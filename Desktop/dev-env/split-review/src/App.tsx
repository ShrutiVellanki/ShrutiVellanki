import { useMemo, useEffect, useState, useCallback, useRef, type ReactNode } from "react"
import { StoreContext, useAppStore } from "./store"
import { generateMockBundle } from "./data/mock-data"
import { TopBar } from "./components/TopBar"
import { DocumentList } from "./components/DocumentList"
import { PageGrid } from "./components/PageGrid"
import { PagePreview } from "./components/PagePreview"
import { ContextMenu } from "./components/ContextMenu"
import { Toast } from "./components/Toast"

function KeyboardShortcuts({ moveStep }: { moveStep: number }) {
  const K = ({ children }: { children: ReactNode }) => (
    <kbd className="font-mono px-1 py-px rounded bg-surface-sunken border border-border text-[9px]">{children}</kbd>
  )
  const Sep = () => <span className="w-px h-3 bg-border/60" />
  return (
    <div className="h-8 px-5 flex items-center gap-4 border-t border-border bg-surface-raised text-[10px] text-ink-muted overflow-x-auto">
      <span className="text-ink-muted/60 font-medium uppercase tracking-widest text-[8px] shrink-0">Keys</span>
      <span className="shrink-0"><K>←</K> <K>→</K> page</span>
      <span className="shrink-0"><K>[</K> <K>]</K> doc</span>
      <Sep />
      <span className="shrink-0"><K>S</K> split here</span>
      <span className="shrink-0">
        <K>⇧</K><K>←</K> <K>⇧</K><K>→</K> move boundary
        {moveStep > 1 && <span className="ml-1 text-accent font-bold">×{moveStep}</span>}
      </span>
      <span className="shrink-0"><K>1</K>–<K>9</K> set step{moveStep > 1 && <span className="ml-0.5 text-accent font-bold">({moveStep})</span>}</span>
      <Sep />
      <span className="shrink-0"><K>⇧</K><K>⌫</K> merge ←</span>
      <span className="shrink-0"><K>⇧</K><K>⌦</K> merge →</span>
      <Sep />
      <span className="shrink-0"><K>⌘</K><K>S</K> save</span>
    </div>
  )
}

function ResizeHandle({ onResize }: { onResize: (delta: number) => void }) {
  const dragging = useRef(false)
  const startX = useRef(0)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    dragging.current = true
    startX.current = e.clientX
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    const dx = startX.current - e.clientX
    if (dx !== 0) {
      onResize(dx)
      startX.current = e.clientX
    }
  }, [onResize])

  const handlePointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  return (
    <div
      className="w-1.5 shrink-0 cursor-col-resize group relative z-10 flex items-center justify-center"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="w-[2px] h-8 rounded-full bg-border group-hover:bg-accent group-active:bg-accent transition-colors" />
    </div>
  )
}

export default function App() {
  const bundle = useMemo(() => generateMockBundle(), [])
  const [state, dispatch] = useAppStore(bundle)
  const [previewWidth, setPreviewWidth] = useState(480)
  const [moveStep, setMoveStep] = useState(1)

  const handlePreviewResize = useCallback((delta: number) => {
    setPreviewWidth((w) => Math.min(1200, Math.max(320, w + delta)))
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
      const { documents } = state.bundle

      if (e.key === "Escape") {
        dispatch({ type: "CLEAR_SELECTION" })
        dispatch({ type: "CLOSE_CONTEXT_MENU" })
      }

      // Number keys 1-9: set move step
      if (e.key >= "1" && e.key <= "9" && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        setMoveStep(parseInt(e.key, 10))
      }

      // Doc navigation: [ ] or Alt+Arrow
      if (e.key === "[" || (e.key === "ArrowUp" && e.altKey)) {
        e.preventDefault()
        dispatch({ type: "NAV_DOC", direction: -1 })
      }
      if (e.key === "]" || (e.key === "ArrowDown" && e.altKey)) {
        e.preventDefault()
        dispatch({ type: "NAV_DOC", direction: 1 })
      }

      // Page navigation: Arrow keys (no modifiers)
      if (e.key === "ArrowLeft" && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault()
        dispatch({ type: "NAV_PAGE", direction: -1 })
      }
      if (e.key === "ArrowRight" && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault()
        dispatch({ type: "NAV_PAGE", direction: 1 })
      }

      // Split: S — split before current page (creates new doc boundary)
      if (e.key === "s" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const doc = documents.find((d) => d.id === state.selectedDocId)
        const pageId = state.selectedPageId
        if (doc && pageId && doc.pages[0]?.pageId !== pageId) {
          e.preventDefault()
          dispatch({ type: "SPLIT_BEFORE_PAGE", docId: doc.id, pageId })
        }
      }

      // Merge: Shift+Backspace — merge current doc into previous (keep left)
      if (e.key === "Backspace" && e.shiftKey && !e.ctrlKey && !e.metaKey) {
        const docIdx = documents.findIndex((d) => d.id === state.selectedDocId)
        if (docIdx > 0) {
          e.preventDefault()
          dispatch({ type: "REMOVE_SPLIT", docId: documents[docIdx].id, direction: "left" })
        }
      }

      // Merge: Shift+Delete — merge previous doc into current (keep right)
      if (e.key === "Delete" && e.shiftKey && !e.ctrlKey && !e.metaKey) {
        const docIdx = documents.findIndex((d) => d.id === state.selectedDocId)
        if (docIdx > 0) {
          e.preventDefault()
          dispatch({ type: "REMOVE_SPLIT", docId: documents[docIdx].id, direction: "right" })
        }
      }

      // Move boundary: Shift+Arrow — move pages by moveStep across the upper boundary
      if (e.key === "ArrowLeft" && e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
        const docIdx = documents.findIndex((d) => d.id === state.selectedDocId)
        if (docIdx > 0) {
          e.preventDefault()
          dispatch({ type: "MOVE_BOUNDARY", splitAfterDocId: documents[docIdx - 1].id, delta: -moveStep })
        }
      }
      if (e.key === "ArrowRight" && e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
        const docIdx = documents.findIndex((d) => d.id === state.selectedDocId)
        if (docIdx > 0) {
          e.preventDefault()
          dispatch({ type: "MOVE_BOUNDARY", splitAfterDocId: documents[docIdx - 1].id, delta: moveStep })
        }
      }

      // Ctrl+S — save
      if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        dispatch({ type: "SAVE" })
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [dispatch, state.bundle, state.selectedDocId, state.selectedPageId, moveStep])

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      <div className="h-screen flex flex-col bg-surface font-sans text-ink overflow-hidden">
        <TopBar />

        <div className="flex-1 flex min-h-0">
          <aside className="w-72 shrink-0 border-r border-border bg-surface-raised overflow-hidden">
            <DocumentList />
          </aside>

          <main className="flex-1 min-w-0 overflow-hidden">
            <PageGrid />
          </main>

          <ResizeHandle onResize={handlePreviewResize} />

          <aside
            className="shrink-0 border-l border-border bg-surface-raised overflow-hidden"
            style={{ width: previewWidth }}
          >
            <PagePreview />
          </aside>
        </div>

        <KeyboardShortcuts moveStep={moveStep} />
        <ContextMenu />
        <Toast />
      </div>
    </StoreContext.Provider>
  )
}
