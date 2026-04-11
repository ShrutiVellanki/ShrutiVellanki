export type Classification =
  | "wages"
  | "schedule_b_interest"
  | "schedule_a_deductions"
  | "brokerage"
  | "schedule_c_business"
  | "pensions_annuities_iras"
  | "charitable_contributions"
  | "unclassified"

export const CLASSIFICATION_META: Record<
  Classification,
  { label: string; color: string; bg: string; shortLabel: string }
> = {
  wages:                    { label: "Wages",                        color: "#6c5ce7", bg: "rgba(108,92,231,0.06)",  shortLabel: "W-2" },
  schedule_b_interest:      { label: "Schedule B — Interest",        color: "#0984e3", bg: "rgba(9,132,227,0.06)",   shortLabel: "Sch B" },
  schedule_a_deductions:    { label: "Schedule A — Deductions",      color: "#0984e3", bg: "rgba(9,132,227,0.06)",   shortLabel: "Sch A" },
  brokerage:                { label: "Brokerage & Tax Statements",   color: "#00b894", bg: "rgba(0,184,148,0.06)",   shortLabel: "Brkrg" },
  schedule_c_business:      { label: "Schedule C — Business",        color: "#e17055", bg: "rgba(225,112,85,0.06)",  shortLabel: "Sch C" },
  pensions_annuities_iras:  { label: "Pensions, Annuities & IRAs",   color: "#fdcb6e", bg: "rgba(253,203,110,0.08)", shortLabel: "Retire" },
  charitable_contributions: { label: "Charitable Contributions",     color: "#e84393", bg: "rgba(232,67,147,0.06)",  shortLabel: "Charity" },
  unclassified:             { label: "Unclassified",                 color: "#636e72", bg: "rgba(99,110,114,0.06)",  shortLabel: "Other" },
}

export const ALL_CLASSIFICATIONS = Object.keys(CLASSIFICATION_META) as Classification[]

export interface Page {
  pageId: string
  originalPageNumber: number
  pageImageUrl: string
}

export interface Document {
  id: string
  fileName: string
  name: string
  classification: Classification
  shortDescription: string
  pages: Page[]
}

export interface SplitResponse {
  bundleId: string
  bundleName: string
  totalPages: number
  documents: Document[]
}

export interface RangeSelection {
  startPageId: string
  endPageId: string
}

export interface ContextMenuState {
  x: number
  y: number
  target:
    | { kind: "page"; pageId: string; docId: string }
    | { kind: "range"; range: RangeSelection; docId: string }
    | { kind: "split"; prevDocId: string; docId: string }
    | { kind: "doc-header"; docId: string }
}

export interface AppState {
  bundle: SplitResponse
  selectedDocId: string | null
  selectedPageId: string | null
  hoveredPageId: string | null
  rangeSelection: RangeSelection | null
  contextMenu: ContextMenuState | null
  ghostSplitPageId: string | null
  unsavedChanges: boolean
  lastSavedDocId: string | null
  toast: { message: string; type: "success" | "error" | "info" } | null
}

export type AppAction =
  | { type: "SELECT_DOC"; docId: string }
  | { type: "SELECT_PAGE"; pageId: string }
  | { type: "SHIFT_SELECT_PAGE"; pageId: string }
  | { type: "HOVER_PAGE"; pageId: string | null }
  | { type: "SET_GHOST_SPLIT"; pageId: string | null }
  | { type: "CLEAR_SELECTION" }
  | { type: "OPEN_CONTEXT_MENU"; menu: ContextMenuState }
  | { type: "CLOSE_CONTEXT_MENU" }
  | { type: "UPDATE_DOC_META"; docId: string; field: keyof Pick<Document, "fileName" | "name" | "classification" | "shortDescription">; value: string }
  | { type: "SPLIT_BEFORE_PAGE"; docId: string; pageId: string }
  | { type: "CREATE_DOC_FROM_RANGE"; docId: string; startPageId: string; endPageId: string }
  | { type: "REMOVE_SPLIT"; docId: string; direction: "left" | "right" }
  | { type: "MOVE_BOUNDARY"; splitAfterDocId: string; delta: number }
  | { type: "MOVE_BOUNDARY_TO_PAGE"; splitAfterDocId: string; targetOriginalPage: number }
  | { type: "CREATE_EMPTY_DOC" }
  | { type: "DELETE_DOC"; docId: string }
  | { type: "NAV_DOC"; direction: -1 | 1 }
  | { type: "NAV_PAGE"; direction: -1 | 1 }
  | { type: "SAVE" }
  | { type: "TOAST"; toast: AppState["toast"] }
