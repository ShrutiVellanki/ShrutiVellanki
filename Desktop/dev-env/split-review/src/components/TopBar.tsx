import { Save, FileStack, Check } from "lucide-react"
import { useStore } from "../store"

export function TopBar() {
  const { state, dispatch } = useStore()
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

  return (
    <header className="h-13 px-5 flex items-center gap-4 border-b border-border bg-surface-raised">
      <div className="flex items-center gap-2.5">
        <FileStack className="w-5 h-5 text-accent" />
        <h1 className="text-[15px] font-bold tracking-tight text-ink">Split Review</h1>
      </div>
      <div className="h-5 w-px bg-border mx-1" />
      <span className="text-[12px] text-ink-secondary truncate max-w-md">{state.bundle.bundleName}</span>
      <div className="flex-1" />
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
