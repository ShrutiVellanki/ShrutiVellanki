import { useRef, useEffect, useState } from "react"
import { ChevronUp, ChevronDown, Check, ChevronsUpDown } from "lucide-react"

import { useStore } from "../store"
import { CLASSIFICATION_META, ALL_CLASSIFICATIONS } from "../types"
import type { Document, Classification } from "../types"

function ClassificationPicker({
  value,
  onChange,
}: {
  value: Classification
  onChange: (c: Classification) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const meta = CLASSIFICATION_META[value]

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener("mousedown", handleClick, true)
    return () => window.removeEventListener("mousedown", handleClick, true)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-7 px-2 rounded-md border border-border bg-surface-raised text-[11px] text-ink flex items-center gap-2 focus:border-border-focus focus:ring-1 focus:ring-border-focus/30 outline-none cursor-pointer transition-colors"
      >
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />
        <span
          className="px-1 py-px rounded text-[9px] font-bold shrink-0"
          style={{ background: meta.color + "18", color: meta.color }}
        >
          {meta.shortLabel}
        </span>
        <span className="flex-1 truncate text-left">{meta.label}</span>
        <ChevronsUpDown className="w-3 h-3 text-ink-muted shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-[240px] overflow-y-auto rounded-lg border border-border bg-surface-raised shadow-lg py-1">
          {ALL_CLASSIFICATIONS.map((c) => {
            const m = CLASSIFICATION_META[c]
            const isActive = c === value
            return (
              <button
                key={c}
                type="button"
                onClick={() => {
                  onChange(c)
                  setOpen(false)
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-[11px] text-left transition-colors ${
                  isActive ? "bg-accent-soft text-ink" : "text-ink hover:bg-surface-overlay"
                }`}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: m.color }} />
                <span
                  className="px-1 py-px rounded text-[9px] font-bold shrink-0"
                  style={{ background: m.color + "18", color: m.color }}
                >
                  {m.shortLabel}
                </span>
                <span className="flex-1 truncate">{m.label}</span>
                {isActive && <Check className="w-3 h-3 text-accent shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function DocCard({ doc, index }: { doc: Document; index: number }) {
  const { state, dispatch } = useStore()
  const isSelected = state.selectedDocId === doc.id
  const ref = useRef<HTMLDivElement>(null)
  const meta = CLASSIFICATION_META[doc.classification]
  const isEmpty = doc.pages.length === 0

  useEffect(() => {
    if (isSelected && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [isSelected])

  const pageRange = isEmpty
    ? "empty"
    : doc.pages.length === 1
      ? `p.${doc.pages[0].originalPageNumber}`
      : `p.${doc.pages[0].originalPageNumber}–${doc.pages[doc.pages.length - 1].originalPageNumber}`

  return (
    <div
      ref={ref}
      className={`border-b border-border/60 transition-colors ${
        isSelected
          ? "bg-accent-soft border-l-[3px] border-l-accent"
          : "hover:bg-surface-overlay border-l-[3px] border-l-transparent"
      }`}
    >
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
        onClick={() => dispatch({ type: "SELECT_DOC", docId: doc.id })}
      >
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />
        <span className="flex-1 min-w-0">
          <span className="text-[11px] font-semibold text-ink truncate block">{doc.fileName}</span>
          <span className="text-[10px] text-ink-muted font-mono">{pageRange} · {doc.pages.length} pg</span>
        </span>
      </button>

      {/* Always-visible metadata when selected */}
      {isSelected && (
        <div className="px-3 pb-3 space-y-2">
          {/* Filename */}
          <div>
            <label className="text-[9px] uppercase tracking-widest text-ink-muted font-semibold block mb-0.5">
              Filename
            </label>
            <input
              type="text"
              value={doc.fileName}
              onChange={(e) =>
                dispatch({ type: "UPDATE_DOC_META", docId: doc.id, field: "fileName", value: e.target.value })
              }
              className="w-full h-7 px-2 rounded-md border border-border bg-surface-raised text-[11px] font-mono text-ink focus:border-border-focus focus:ring-1 focus:ring-border-focus/30 outline-none transition-colors"
            />
          </div>

          {/* Name */}
          <div>
            <label className="text-[9px] uppercase tracking-widest text-ink-muted font-semibold block mb-0.5">
              Name
            </label>
            <input
              type="text"
              value={doc.name}
              onChange={(e) =>
                dispatch({ type: "UPDATE_DOC_META", docId: doc.id, field: "name", value: e.target.value })
              }
              className="w-full h-7 px-2 rounded-md border border-border bg-surface-raised text-[11px] text-ink focus:border-border-focus focus:ring-1 focus:ring-border-focus/30 outline-none transition-colors"
            />
          </div>

          {/* Classification */}
          <div>
            <label className="text-[9px] uppercase tracking-widest text-ink-muted font-semibold block mb-0.5">
              Classification
            </label>
            <ClassificationPicker
              value={doc.classification}
              onChange={(c) =>
                dispatch({
                  type: "UPDATE_DOC_META",
                  docId: doc.id,
                  field: "classification",
                  value: c,
                })
              }
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[9px] uppercase tracking-widest text-ink-muted font-semibold block mb-0.5">
              Description
            </label>
            <textarea
              value={doc.shortDescription}
              onChange={(e) =>
                dispatch({ type: "UPDATE_DOC_META", docId: doc.id, field: "shortDescription", value: e.target.value })
              }
              rows={2}
              className="w-full px-2 py-1.5 rounded-md border border-border bg-surface-raised text-[11px] text-ink-secondary resize-none focus:border-border-focus focus:ring-1 focus:ring-border-focus/30 outline-none transition-colors"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function DocumentList() {
  const { state, dispatch } = useStore()
  const docs = state.bundle.documents
  const totalPages = docs.reduce((s, d) => s + d.pages.length, 0)
  const emptyDocs = docs.filter((d) => d.pages.length === 0).length
  const currentIdx = docs.findIndex((d) => d.id === state.selectedDocId)
  const hasPrev = currentIdx > 0
  const hasNext = currentIdx >= 0 && currentIdx < docs.length - 1

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <h2 className="text-[13px] font-bold text-ink tracking-tight">Documents</h2>
        <div className="flex items-center gap-2 text-[10px] font-mono text-ink-muted">
          <span className="px-1.5 py-0.5 rounded bg-surface-sunken">{docs.length} docs</span>
          <span className="px-1.5 py-0.5 rounded bg-surface-sunken">{totalPages}/{state.bundle.totalPages} pg</span>
          {emptyDocs > 0 && <span className="px-1.5 py-0.5 rounded bg-warning/10 text-warning font-semibold">{emptyDocs} empty</span>}
        </div>
      </div>

      {/* Sequential navigation */}
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <button
          onClick={() => dispatch({ type: "NAV_DOC", direction: -1 })}
          disabled={!hasPrev}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-medium text-ink-secondary hover:bg-surface-overlay disabled:opacity-25 disabled:pointer-events-none transition-colors"
        >
          <ChevronUp className="w-3 h-3" /> Prev
        </button>
        <span className="text-[10px] font-mono text-ink-muted min-w-[3.5rem] text-center">
          {currentIdx >= 0 ? `${currentIdx + 1} / ${docs.length}` : "—"}
        </span>
        <button
          onClick={() => dispatch({ type: "NAV_DOC", direction: 1 })}
          disabled={!hasNext}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-medium text-ink-secondary hover:bg-surface-overlay disabled:opacity-25 disabled:pointer-events-none transition-colors"
        >
          Next <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {docs.map((doc, i) => (
          <DocCard key={doc.id} doc={doc} index={i} />
        ))}
      </div>

    </div>
  )
}
