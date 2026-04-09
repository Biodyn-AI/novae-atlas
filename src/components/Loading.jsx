export function Loading({ what = 'data' }) {
  return (
    <div className="flex items-center justify-center py-16 text-slate-500">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Loading {what}…</span>
      </div>
    </div>
  )
}

export function ErrorBox({ error }) {
  return (
    <div className="rounded-lg border border-rose-800 bg-rose-950/40 p-4 text-sm text-rose-200">
      <div className="font-semibold mb-1">Failed to load</div>
      <div className="font-mono text-xs text-rose-300">{String(error?.message || error)}</div>
    </div>
  )
}
