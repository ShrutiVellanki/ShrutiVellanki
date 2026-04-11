import { useState } from "react"
import { Save, Download, FileStack, Check, Loader2 } from "lucide-react"
import { useStore } from "../store"
import { CLASSIFICATION_META } from "../types"
import { downloadDocumentAsPdf } from "../utils/download-pdf"

export function TopBar() {
  const { state, dispatch } = useStore()
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState("")
  const totalPages = state.bundle.documents.reduce((s, d) => s + d.pages.length, 0)
  const emptyDocs = state.bundle.documents.filter((d) => d.pages.length === 0).length
  const canSave = emptyDocs === 0 && totalPages === state.bundle.totalPages
  const selectedDoc = state.bundle.documents.find((d) => d.id === state.selectedDocId)

  function handleSave() {
    if (!canSave) {
      dispatch({
        type: "TOAST",
        toast: {
          message: emptyDocs > 0
            ? `Cannot save: ${emptyDocs} empty document(s). Delete or assign pages first.`
            : "Cannot save: some pages are unassigned.",
          type: "error",
        },
      })
      return
    }
    dispatch({ type: "SAVE" })
  }

  async function handleDownload() {
    if (!selectedDoc || downloading) return
    setDownloading(true)
    setProgress(`0 / ${selectedDoc.pages.length}`)
    dispatch({
      type: "TOAST",
      toast: { message: `Generating PDF for ${selectedDoc.fileName}…`, type: "info" },
    })
    try {
      await downloadDocumentAsPdf(selectedDoc, (current, total) => {
        setProgress(`${current} / ${total}`)
      })
      dispatch({
        type: "TOAST",
        toast: { message: `Downloaded ${selectedDoc.fileName} (${selectedDoc.pages.length} pages)`, type: "success" },
      })
    } catch (err) {
      dispatch({
        type: "TOAST",
        toast: { message: `Download failed: ${err instanceof Error ? err.message : "unknown error"}`, type: "error" },
      })
    } finally {
      setDownloading(false)
      setProgress("")
    }
  }

  return (
    <header className="h-13 px-5 flex items-center gap-4 border-b border-border bg-surface-raised">
      <div className="flex items-center gap-2.5">
        <FileStack className="w-5 h-5 text-accent" />
        <h1 className="text-[15px] font-bold tracking-tight text-ink">Split Review</h1>
      </div>
      <div className="h-5 w-px bg-border mx-1" />
      <span className="text-[12px] text-ink-secondary truncate max-w-md">{state.bundle.bundleName}</span>
      <div className="flex-1" />
      {selectedDoc ? (
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-ink-secondary hover:bg-surface-overlay border border-border transition-colors max-w-[280px] disabled:opacity-60 disabled:pointer-events-none"
        >
          {downloading
            ? <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
            : <Download className="w-3.5 h-3.5 shrink-0" />
          }
          <span className="truncate">
            {downloading ? `Rendering ${progress}…` : selectedDoc.fileName}
          </span>
          <span
            className="shrink-0 w-1.5 h-1.5 rounded-full"
            style={{ background: CLASSIFICATION_META[selectedDoc.classification].color }}
          />
        </button>
      ) : (
        <span className="text-[11px] text-ink-muted italic">Select a doc to download</span>
      )}
      <button
        onClick={handleSave}
        title={selectedDoc ? `Save and bookmark at ${selectedDoc.fileName}` : "Save changes"}
        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
          state.unsavedChanges
            ? "bg-accent text-white hover:bg-accent-hover shadow-sm"
            : "bg-surface-sunken text-ink-muted"
        }`}
      >
        {state.unsavedChanges ? <><Save className="w-3.5 h-3.5" /> Save Changes</> : <><Check className="w-3.5 h-3.5" /> Saved</>}
      </button>
    </header>
  )
}
