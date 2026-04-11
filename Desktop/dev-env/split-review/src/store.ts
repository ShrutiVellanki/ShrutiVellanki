import { useReducer, createContext, useContext } from "react"
import type { AppState, AppAction, Document, Page, SplitResponse } from "./types"

function findPageGlobal(docs: Document[], pageId: string) {
  for (const doc of docs) {
    const idx = doc.pages.findIndex((p) => p.pageId === pageId)
    if (idx !== -1) return { doc, pageIndex: idx }
  }
  return null
}

function allPages(docs: Document[]) {
  return docs.flatMap((d) => d.pages)
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SELECT_DOC": {
      const doc = state.bundle.documents.find((d) => d.id === action.docId)
      return {
        ...state,
        selectedDocId: action.docId,
        selectedPageId: doc?.pages[0]?.pageId ?? state.selectedPageId,
        rangeSelection: null,
        contextMenu: null,
      }
    }

    case "SELECT_PAGE": {
      const found = findPageGlobal(state.bundle.documents, action.pageId)
      return {
        ...state,
        selectedPageId: action.pageId,
        selectedDocId: found?.doc.id ?? state.selectedDocId,
        rangeSelection: null,
        contextMenu: null,
      }
    }

    case "SHIFT_SELECT_PAGE": {
      if (!state.selectedPageId) return reducer(state, { type: "SELECT_PAGE", pageId: action.pageId })
      const pages = allPages(state.bundle.documents)
      const startIdx = pages.findIndex((p) => p.pageId === state.selectedPageId)
      const endIdx = pages.findIndex((p) => p.pageId === action.pageId)
      if (startIdx === -1 || endIdx === -1) return state
      const lo = Math.min(startIdx, endIdx)
      const hi = Math.max(startIdx, endIdx)
      return {
        ...state,
        rangeSelection: { startPageId: pages[lo].pageId, endPageId: pages[hi].pageId },
        contextMenu: null,
      }
    }

    case "HOVER_PAGE":
      return { ...state, hoveredPageId: action.pageId }

    case "SET_GHOST_SPLIT":
      return { ...state, ghostSplitPageId: action.pageId }

    case "CLEAR_SELECTION":
      return { ...state, rangeSelection: null, contextMenu: null }

    case "OPEN_CONTEXT_MENU":
      return { ...state, contextMenu: action.menu }

    case "CLOSE_CONTEXT_MENU":
      return { ...state, contextMenu: null }

    case "UPDATE_DOC_META": {
      const docs = state.bundle.documents.map((d) =>
        d.id === action.docId ? { ...d, [action.field]: action.value } : d,
      )
      return { ...state, bundle: { ...state.bundle, documents: docs }, unsavedChanges: true }
    }

    case "SPLIT_BEFORE_PAGE": {
      const docIdx = state.bundle.documents.findIndex((d) => d.id === action.docId)
      if (docIdx === -1) return state
      const doc = state.bundle.documents[docIdx]
      const pageIdx = doc.pages.findIndex((p) => p.pageId === action.pageId)
      if (pageIdx <= 0) return state

      const left = doc.pages.slice(0, pageIdx)
      const right = doc.pages.slice(pageIdx)
      const baseName = doc.fileName.replace(/\.pdf$/i, "")

      const leftDoc: Document = {
        ...doc,
        fileName: `${baseName}_p${left[0].originalPageNumber}-${left[left.length - 1].originalPageNumber}.pdf`,
        name: `${doc.name} (p.${left[0].originalPageNumber}–${left[left.length - 1].originalPageNumber})`,
        pages: left,
      }

      const newDoc: Document = {
        id: `doc-${Date.now()}`,
        fileName: `${baseName}_p${right[0].originalPageNumber}-${right[right.length - 1].originalPageNumber}.pdf`,
        name: `${doc.name} (p.${right[0].originalPageNumber}–${right[right.length - 1].originalPageNumber})`,
        classification: doc.classification,
        shortDescription: doc.shortDescription,
        pages: right,
      }

      const docs = [...state.bundle.documents]
      docs.splice(docIdx, 1, leftDoc, newDoc)
      return {
        ...state,
        bundle: { ...state.bundle, documents: docs },
        selectedDocId: newDoc.id,
        selectedPageId: right[0].pageId,
        rangeSelection: null,
        contextMenu: null,
        unsavedChanges: true,
      }
    }

    case "CREATE_DOC_FROM_RANGE": {
      const docIdx = state.bundle.documents.findIndex((d) => d.id === action.docId)
      if (docIdx === -1) return state
      const doc = state.bundle.documents[docIdx]
      const startIdx = doc.pages.findIndex((p) => p.pageId === action.startPageId)
      const endIdx = doc.pages.findIndex((p) => p.pageId === action.endPageId)
      if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) return state

      const before = doc.pages.slice(0, startIdx)
      const selected = doc.pages.slice(startIdx, endIdx + 1)
      const after = doc.pages.slice(endIdx + 1)
      const baseName = doc.fileName.replace(/\.pdf$/i, "")
      const pageLabel = (pages: Page[]) => pages.length === 1
        ? `p.${pages[0].originalPageNumber}`
        : `p.${pages[0].originalPageNumber}–${pages[pages.length - 1].originalPageNumber}`

      const newDoc: Document = {
        id: `doc-${Date.now()}`,
        fileName: `${baseName}_p${selected[0].originalPageNumber}-${selected[selected.length - 1].originalPageNumber}.pdf`,
        name: `${doc.name} (${pageLabel(selected)})`,
        classification: doc.classification,
        shortDescription: doc.shortDescription,
        pages: selected,
      }

      const result: Document[] = []
      const docs = [...state.bundle.documents]

      if (before.length > 0) {
        result.push({
          ...doc,
          fileName: `${baseName}_p${before[0].originalPageNumber}-${before[before.length - 1].originalPageNumber}.pdf`,
          name: `${doc.name} (${pageLabel(before)})`,
          pages: before,
        })
      }
      result.push(newDoc)
      if (after.length > 0) {
        result.push({
          id: `doc-${Date.now() + 1}`,
          fileName: `${baseName}_p${after[0].originalPageNumber}-${after[after.length - 1].originalPageNumber}.pdf`,
          name: `${doc.name} (${pageLabel(after)})`,
          classification: doc.classification,
          shortDescription: doc.shortDescription,
          pages: after,
        })
      }

      docs.splice(docIdx, 1, ...result)
      return {
        ...state,
        bundle: { ...state.bundle, documents: docs },
        selectedDocId: newDoc.id,
        selectedPageId: selected[0].pageId,
        rangeSelection: null,
        contextMenu: null,
        unsavedChanges: true,
      }
    }

    case "REMOVE_SPLIT": {
      const docIdx = state.bundle.documents.findIndex((d) => d.id === action.docId)
      if (docIdx <= 0) return state
      const prev = state.bundle.documents[docIdx - 1]
      const curr = state.bundle.documents[docIdx]

      const survivor = action.direction === "right" ? curr : prev
      const merged: Document = {
        ...survivor,
        pages: [...prev.pages, ...curr.pages],
      }

      const docs = [...state.bundle.documents]
      docs.splice(docIdx - 1, 2, merged)
      return {
        ...state,
        bundle: { ...state.bundle, documents: docs },
        selectedDocId: merged.id,
        contextMenu: null,
        unsavedChanges: true,
      }
    }

    case "MOVE_BOUNDARY": {
      const docIdx = state.bundle.documents.findIndex((d) => d.id === action.splitAfterDocId)
      if (docIdx === -1 || docIdx >= state.bundle.documents.length - 1) return state
      const upper = { ...state.bundle.documents[docIdx], pages: [...state.bundle.documents[docIdx].pages] }
      const lower = { ...state.bundle.documents[docIdx + 1], pages: [...state.bundle.documents[docIdx + 1].pages] }

      if (action.delta > 0) {
        const count = Math.min(action.delta, lower.pages.length - 1)
        if (count <= 0) return state
        const moved = lower.pages.splice(0, count)
        upper.pages.push(...moved)
      } else {
        const count = Math.min(-action.delta, upper.pages.length - 1)
        if (count <= 0) return state
        const moved = upper.pages.splice(upper.pages.length - count, count)
        lower.pages.unshift(...moved)
      }

      const docs = [...state.bundle.documents]
      docs[docIdx] = upper
      docs[docIdx + 1] = lower
      return { ...state, bundle: { ...state.bundle, documents: docs }, unsavedChanges: true }
    }

    case "NAV_DOC": {
      const idx = state.bundle.documents.findIndex((d) => d.id === state.selectedDocId)
      const next = idx + action.direction
      if (next < 0 || next >= state.bundle.documents.length) return state
      const doc = state.bundle.documents[next]
      return {
        ...state,
        selectedDocId: doc.id,
        selectedPageId: doc.pages[0]?.pageId ?? null,
        rangeSelection: null,
        contextMenu: null,
      }
    }

    case "NAV_PAGE": {
      const doc = state.bundle.documents.find((d) => d.id === state.selectedDocId)
      if (!doc || doc.pages.length === 0) return state
      const curIdx = doc.pages.findIndex((p) => p.pageId === state.selectedPageId)
      const nextIdx = curIdx + action.direction
      if (nextIdx < 0 || nextIdx >= doc.pages.length) return state
      return {
        ...state,
        selectedPageId: doc.pages[nextIdx].pageId,
        rangeSelection: null,
        contextMenu: null,
      }
    }

    case "CREATE_EMPTY_DOC": {
      const newDoc: Document = {
        id: `doc-${Date.now()}`,
        fileName: "new_document.pdf",
        name: "New Document",
        classification: "unclassified",
        shortDescription: "",
        pages: [],
      }
      return {
        ...state,
        bundle: { ...state.bundle, documents: [...state.bundle.documents, newDoc] },
        selectedDocId: newDoc.id,
        unsavedChanges: true,
      }
    }

    case "DELETE_DOC": {
      const doc = state.bundle.documents.find((d) => d.id === action.docId)
      if (!doc || doc.pages.length > 0) return state
      const docs = state.bundle.documents.filter((d) => d.id !== action.docId)
      return {
        ...state,
        bundle: { ...state.bundle, documents: docs },
        selectedDocId: docs[0]?.id ?? null,
        contextMenu: null,
        unsavedChanges: true,
      }
    }

    case "SAVE": {
      const docIdx = state.bundle.documents.findIndex((d) => d.id === state.selectedDocId)
      const doc = docIdx >= 0 ? state.bundle.documents[docIdx] : null
      const total = state.bundle.documents.length
      const position = doc ? `${docIdx + 1} / ${total}` : null
      const resumeMsg = doc
        ? `Saved — resume at ${doc.fileName} (${position})`
        : "Changes saved successfully"

      try {
        localStorage.setItem(`split-review:${state.bundle.bundleId}`, JSON.stringify({
          selectedDocId: state.selectedDocId,
          selectedPageId: state.selectedPageId,
          timestamp: Date.now(),
        }))
      } catch {}

      return {
        ...state,
        unsavedChanges: false,
        lastSavedDocId: state.selectedDocId,
        toast: { message: resumeMsg, type: "success" },
      }
    }

    case "TOAST":
      return { ...state, toast: action.toast }

    default:
      return state
  }
}

export function createInitialState(bundle: SplitResponse): AppState {
  let selectedDocId = bundle.documents[0]?.id ?? null
  let selectedPageId = bundle.documents[0]?.pages[0]?.pageId ?? null
  let resumeToast: AppState["toast"] = null

  try {
    const raw = localStorage.getItem(`split-review:${bundle.bundleId}`)
    if (raw) {
      const saved = JSON.parse(raw)
      const doc = bundle.documents.find((d) => d.id === saved.selectedDocId)
      if (doc) {
        selectedDocId = doc.id
        const page = saved.selectedPageId && doc.pages.find((p: { pageId: string }) => p.pageId === saved.selectedPageId)
        selectedPageId = page ? page.pageId : doc.pages[0]?.pageId ?? null
        const idx = bundle.documents.indexOf(doc) + 1
        resumeToast = {
          message: `Resumed at ${doc.fileName} (${idx} / ${bundle.documents.length})`,
          type: "info",
        }
      }
    }
  } catch {}

  return {
    bundle,
    selectedDocId,
    selectedPageId,
    hoveredPageId: null,
    rangeSelection: null,
    contextMenu: null,
    ghostSplitPageId: null,
    unsavedChanges: false,
    lastSavedDocId: selectedDocId,
    toast: resumeToast,
  }
}

export function useAppStore(bundle: SplitResponse) {
  return useReducer(reducer, bundle, createInitialState)
}

interface Ctx { state: AppState; dispatch: React.Dispatch<AppAction> }
export const StoreContext = createContext<Ctx>(null!)
export function useStore() { return useContext(StoreContext) }
