import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getModules, getFeatureTable } from '../lib/data.js'
import { Loading, ErrorBox } from '../components/Loading.jsx'

export default function ModulesPage() {
  const { name } = useParams()
  const navigate = useNavigate()
  const [modulesData, setModulesData] = useState(null)
  const [features, setFeatures] = useState(null)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setModulesData(null); setFeatures(null); setSelected(null); setError(null)
    Promise.all([getModules(name), getFeatureTable(name)])
      .then(([m, f]) => {
        setModulesData(m)
        setFeatures(f)
      })
      .catch(setError)
  }, [name])

  if (error) return <ErrorBox error={error} />
  if (!modulesData || !features) return <Loading what="modules" />

  const featureMap = Object.fromEntries(features.map((f) => [f.feature_idx, f]))
  const selectedModule = selected != null
    ? modulesData.modules.find((m) => m.module_id === selected)
    : null

  const filteredModules = search
    ? modulesData.modules.filter((m) => {
        const q = search.toLowerCase()
        if (String(m.module_id).includes(q)) return true
        // search member feature labels
        return m.members.slice(0, 30).some((idx) => {
          const f = featureMap[idx]
          return f && (
            (f.lb || '').toLowerCase().includes(q) ||
            (f.top_genes || '').toLowerCase().includes(q) ||
            (f.top_PanglaoDB_v2 || '').toLowerCase().includes(q)
          )
        })
      })
    : modulesData.modules

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-xs text-slate-500 mb-2">
        <Link to="/surfaces" className="hover:text-brand-300">Surfaces</Link> /{' '}
        <Link to={`/surface/${name}`} className="hover:text-brand-300 font-mono">{name}</Link> /{' '}
        <span>modules</span>
      </div>
      <h1 className="text-3xl font-bold text-slate-50 mb-3">
        Modules · <span className="font-mono text-brand-300">{name}</span>
      </h1>

      {/* Intro */}
      <div className="card border-slate-700 mb-6">
        <details open={!modulesData.modules.length || modulesData.modules.length < 5}>
          <summary className="cursor-pointer text-sm font-semibold text-slate-200 list-none flex items-center gap-2">
            <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            What is a module?
            <span className="text-xs text-slate-500 ml-auto">click to expand</span>
          </summary>
          <div className="mt-4 text-sm text-slate-400 leading-relaxed space-y-3">
            <p>
              A <strong className="text-slate-200">module</strong> is a community of SAE features
              that fire on the same cells. Two features are linked if they activate together more
              often than expected by chance (PMI &gt; 1, where PMI is pointwise mutual information).
              Modules are the connected communities found by{' '}
              <a href="https://en.wikipedia.org/wiki/Leiden_algorithm" target="_blank" rel="noopener" className="text-brand-300 hover:underline">Leiden clustering</a>{' '}
              on this co-activation graph.
            </p>
            <p>
              <strong className="text-slate-200">Why this matters:</strong> features rarely fire in
              isolation — biology is modular. A "T cell follicle" module might contain features
              for various T-cell subtypes plus features for the surrounding epithelium. Browsing
              modules surfaces these natural groupings, and sometimes reveals unexpected
              co-occurrences (e.g., "this module is mostly stromal markers, but it also includes
              one immune feature — what's the connection?").
            </p>
            <p>
              <strong className="text-slate-200">How to use this page:</strong> the left column
              lists the {modulesData.n_modules ?? modulesData.modules.length} modules found at this
              surface, sorted by size (largest first). Click any module to see its member
              features on the right. Use the search box to find a module containing a specific
              cell type, gene, or feature label.
            </p>
          </div>
        </details>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT — module list */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500 font-semibold">
              {filteredModules.length} of {modulesData.n_modules ?? modulesData.modules.length} modules
            </div>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by id, gene, or label…"
            className="input mb-2"
          />
          <div className="card !p-0 max-h-[70vh] overflow-y-auto">
            {filteredModules.map((m) => {
              const isSelected = selected === m.module_id
              return (
                <button
                  key={m.module_id}
                  onClick={() => setSelected(m.module_id)}
                  className={`w-full text-left px-3 py-2 border-b border-slate-800 flex items-center justify-between text-sm transition ${
                    isSelected
                      ? 'bg-brand-500/15 text-brand-200 ring-1 ring-inset ring-brand-500/30'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="font-mono">module #{m.module_id}</span>
                  <span className="text-xs text-slate-500 font-mono">{m.n_features} feats</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* RIGHT — selected module's members */}
        <div className="lg:col-span-2">
          {selectedModule ? (
            <div>
              <div className="mb-3">
                <h2 className="text-xl font-bold text-slate-100">
                  Module #{selectedModule.module_id}
                  <span className="text-slate-500 font-normal text-base ml-2">·</span>
                  <span className="text-slate-400 font-normal text-base ml-2">{selectedModule.n_features} member features</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Features that co-activate on the same cells more often than chance.
                </p>
              </div>
              <div className="card !p-0 overflow-hidden">
                <table className="atlas">
                  <thead>
                    <tr>
                      <th>idx</th>
                      <th>label</th>
                      <th>top genes</th>
                      <th>tissue</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedModule.members.slice(0, 100).map((idx) => {
                      const f = featureMap[idx]
                      if (!f) return null
                      return (
                        <tr
                          key={idx}
                          className="cursor-pointer"
                          onClick={() => navigate(`/surface/${name}/feature/${idx}`)}
                        >
                          <td className="font-mono text-xs text-brand-300">{idx}</td>
                          <td>
                            {f.lb ? (
                              <span className="font-semibold text-slate-100">{f.lb}</span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                          <td className="text-[11px] font-mono text-slate-400 max-w-xs">
                            {(f.top_genes || '').toUpperCase() || '—'}
                          </td>
                          <td>
                            {f.top_tissue ? <span className="pill-slate">{f.top_tissue}</span> : '—'}
                          </td>
                          <td className="text-right text-brand-400 text-xs">→</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {selectedModule.members.length > 100 && (
                <div className="text-xs text-slate-500 mt-2 text-right">
                  showing first 100 of {selectedModule.members.length} members
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center text-slate-500 py-16">
              <svg className="w-12 h-12 mx-auto mb-3 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <div className="text-sm">Select a module on the left to see its members.</div>
              <div className="text-xs mt-1">Larger modules at the top usually represent broader concepts (e.g., a tissue type); smaller modules at the bottom often capture finer cell-state distinctions.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
