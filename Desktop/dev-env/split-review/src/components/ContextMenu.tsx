import { useEffect, useRef } from "react"
import { Scissors, FilePlus, Trash2, ChevronsLeft, ChevronsRight } from "lucide-react"
import { useStore } from "../store"

interface MenuItem {
  label: string
  icon: React.ElementType
  action: () => void
  danger?: boolean
  disabled?: boolean
}

function Divider() {
  return <div className="h-px bg-border my-1" />
}

export function ContextMenu() {
  const { state, dispatch } = useStore()
  const ref = useRef<HTMLDivElement>(null)
  const menu = state.contextMenu

  useEffect(() => {
    if (!menu) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        dispatch({ type: "CLOSE_CONTEXT_MENU" })
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") dispatch({ type: "CLOSE_CONTEXT_MENU" })
    }
    window.addEventListener("mousedown", handleClick, true)
    window.addEventListener("keydown", handleKey)
    return () => {
      window.removeEventListener("mousedown", handleClick, true)
      window.removeEventListener("keydown", handleKey)
    }
  }, [menu, dispatch])

  if (!menu) return null

  const items: (MenuItem | "divider")[] = []

  if (menu.target.kind === "page") {
    const { pageId, docId } = menu.target
    const doc = state.bundle.documents.find((d) => d.id === docId)
    const pageIdx = doc?.pages.findIndex((p) => p.pageId === pageId) ?? -1
    const page = doc?.pages[pageIdx]

    if (doc && page && pageIdx > 0) {
      items.push({
        label: `Split here — new doc from p.${page.originalPageNumber} onward`,
        icon: Scissors,
        action: () => dispatch({ type: "SPLIT_BEFORE_PAGE", docId, pageId }),
      })
    }
  }

  if (menu.target.kind === "range") {
    const { range, docId } = menu.target
    const allPgs = state.bundle.documents.flatMap((d) => d.pages)
    const startPage = allPgs.find((p) => p.pageId === range.startPageId)
    const endPage = allPgs.find((p) => p.pageId === range.endPageId)

    const doc = state.bundle.documents.find((d) => d.id === docId)
    const rangeInSameDoc =
      doc?.pages.some((p) => p.pageId === range.startPageId) &&
      doc?.pages.some((p) => p.pageId === range.endPageId)

    if (rangeInSameDoc) {
      items.push({
        label: `Create document from p.${startPage?.originalPageNumber}–${endPage?.originalPageNumber}`,
        icon: FilePlus,
        action: () =>
          dispatch({
            type: "CREATE_DOC_FROM_RANGE",
            docId,
            startPageId: range.startPageId,
            endPageId: range.endPageId,
          }),
      })
    }
  }

  if (menu.target.kind === "split") {
    const { prevDocId, docId } = menu.target
    const leftDoc = state.bundle.documents.find((d) => d.id === prevDocId)
    const rightDoc = state.bundle.documents.find((d) => d.id === docId)
    items.push({
      label: `Merge into left (keep ${leftDoc?.fileName ?? "left"})`,
      icon: ChevronsLeft,
      action: () => dispatch({ type: "REMOVE_SPLIT", docId, direction: "left" }),
    })
    items.push({
      label: `Merge into right (keep ${rightDoc?.fileName ?? "right"})`,
      icon: ChevronsRight,
      action: () => dispatch({ type: "REMOVE_SPLIT", docId, direction: "right" }),
    })
  }

  if (menu.target.kind === "doc-header") {
    const { docId } = menu.target
    const doc = state.bundle.documents.find((d) => d.id === docId)
    const docIdx = state.bundle.documents.findIndex((d) => d.id === docId)
    const isEmpty = !doc || doc.pages.length === 0

    if (docIdx > 0) {
      const aboveDoc = state.bundle.documents[docIdx - 1]
      items.push({
        label: `Merge into above (keep ${aboveDoc.fileName})`,
        icon: ChevronsLeft,
        action: () => dispatch({ type: "REMOVE_SPLIT", docId, direction: "left" }),
      })
      items.push({
        label: `Merge above into this (keep ${doc!.fileName})`,
        icon: ChevronsRight,
        action: () => dispatch({ type: "REMOVE_SPLIT", docId, direction: "right" }),
      })
    }
    if (docIdx < state.bundle.documents.length - 1 && state.bundle.documents[docIdx + 1]) {
      const belowDoc = state.bundle.documents[docIdx + 1]
      if (items.length > 0) items.push("divider")
      items.push({
        label: `Merge below into this (keep ${doc!.fileName})`,
        icon: ChevronsLeft,
        action: () => dispatch({ type: "REMOVE_SPLIT", docId: belowDoc.id, direction: "left" }),
      })
      items.push({
        label: `Merge into below (keep ${belowDoc.fileName})`,
        icon: ChevronsRight,
        action: () => dispatch({ type: "REMOVE_SPLIT", docId: belowDoc.id, direction: "right" }),
      })
    }
    if (isEmpty) {
      if (items.length > 0) items.push("divider")
      items.push({
        label: "Delete empty document",
        icon: Trash2,
        action: () => dispatch({ type: "DELETE_DOC", docId }),
        danger: true,
      })
    }
  }

  const realItems = items.filter((i) => i !== "divider")
  if (realItems.length === 0) return null

  const vw = window.innerWidth
  const vh = window.innerHeight
  const menuW = 260
  const menuH = items.length * 36
  const x = menu.x + menuW > vw ? vw - menuW - 8 : menu.x
  const y = menu.y + menuH > vh ? vh - menuH - 8 : menu.y

  return (
    <div
      ref={ref}
      className="fixed z-[100] min-w-[220px] py-1.5 rounded-xl border border-border bg-surface-raised shadow-xl"
      style={{ left: x, top: y }}
    >
      {items.map((item, i) =>
        item === "divider" ? (
          <Divider key={`d-${i}`} />
        ) : (
          <button
            key={item.label}
            onClick={item.action}
            disabled={item.disabled}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium transition-colors text-left ${
              item.danger
                ? "text-danger hover:bg-danger-soft"
                : "text-ink hover:bg-surface-overlay"
            } disabled:opacity-40 disabled:pointer-events-none`}
          >
            <item.icon className="w-3.5 h-3.5 text-ink-muted shrink-0" />
            {item.label}
          </button>
        ),
      )}
    </div>
  )
}
