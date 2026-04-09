import { useState } from 'react'

export function InfoIcon({ tip }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-block ml-1 align-middle">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-800 text-slate-400 text-[9px] font-bold hover:bg-slate-700 hover:text-slate-200"
        aria-label="Info"
      >
        i
      </button>
      {show && (
        <span className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-lg bg-slate-800 text-slate-100 text-xs font-normal p-3 shadow-xl ring-1 ring-slate-700 leading-relaxed">
          {tip}
        </span>
      )}
    </span>
  )
}
