import { Link, NavLink, Outlet } from 'react-router-dom'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-400 via-brand-600 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-brand-900/40">
              N
            </div>
            <div>
              <div className="font-bold text-slate-100 tracking-tight group-hover:text-brand-300 transition">
                Novae SAE Atlas
              </div>
              <div className="text-[10px] text-slate-500 -mt-0.5 font-mono uppercase tracking-wider">
                novae-human-0
              </div>
            </div>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <NavLink to="/" end className={navClass}>Overview</NavLink>
            <NavLink to="/tour" className={navClass}>Tour</NavLink>
            <NavLink to="/stories" className={navClass}>Stories</NavLink>
            <NavLink to="/genes" className={navClass}>Genes</NavLink>
            <NavLink to="/celltypes" className={navClass}>Cell types</NavLink>
            <NavLink to="/niches" className={navClass}>Niches</NavLink>
            <NavLink to="/surfaces" className={navClass}>Surfaces</NavLink>
            <NavLink to="/about" className={navClass}>About</NavLink>
            <a
              href="https://github.com/Biodyn-AI/novae-atlas"
              target="_blank"
              rel="noopener"
              className="ml-2 px-3 py-1.5 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition text-xs"
            >
              GitHub ↗
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 py-4 text-xs text-slate-500 flex items-center justify-between flex-wrap gap-2">
          <div>
            Novae SAE atlas · 4,525,753 cells · 15 tissues · 3 technologies · 49,152 features
          </div>
          <div>
            <a href="https://www.nature.com/articles/s41592-025-02899-6" target="_blank" rel="noopener" className="hover:text-brand-300">
              Novae · Nature Methods 2025
            </a>
            <span className="mx-2 text-slate-700">·</span>
            <a href="https://arxiv.org/abs/2603.02952" target="_blank" rel="noopener" className="hover:text-brand-300">
              SAE methodology · arXiv:2603.02952
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function navClass({ isActive }) {
  return [
    'px-3 py-1.5 rounded-md transition text-xs font-medium',
    isActive
      ? 'bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30'
      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
  ].join(' ')
}
