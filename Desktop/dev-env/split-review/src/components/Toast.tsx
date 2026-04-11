import { useEffect } from "react"
import { Check, AlertCircle, Info, X } from "lucide-react"
import { useStore } from "../store"

const ICONS = {
  success: Check,
  error: AlertCircle,
  info: Info,
}

const COLORS = {
  success: "bg-success-soft text-green-800 border-green-200",
  error: "bg-danger-soft text-red-800 border-red-200",
  info: "bg-accent-soft text-accent border-accent/20",
}

export function Toast() {
  const { state, dispatch } = useStore()

  useEffect(() => {
    if (!state.toast) return
    const t = setTimeout(() => dispatch({ type: "TOAST", toast: null }), 3500)
    return () => clearTimeout(t)
  }, [state.toast, dispatch])

  if (!state.toast) return null

  const Icon = ICONS[state.toast.type]

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-lg backdrop-blur-sm text-[12px] font-medium animate-slide-up ${
        COLORS[state.toast.type]
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {state.toast.message}
      <button
        onClick={() => dispatch({ type: "TOAST", toast: null })}
        className="p-0.5 rounded hover:bg-black/5 transition-colors ml-2"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}
