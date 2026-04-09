import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getCellTypeIndex } from '../lib/data.js'
import { Loading, ErrorBox } from '../components/Loading.jsx'

export default function CellTypeBrowsePage() {
  const { term } = useParams()
  const navigate = useNavigate()
  const [index, setIndex] = useState(null)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getCellTypeIndex().then(setIndex).catch(setError)
  }, [])

  const sortedTerms = useMemo(() => {
    if (!index) return []
    return Object.entries(index)
      .map(([k, v]) => ({ term: k, n: v.n_features, library: v.library }))
      .sort((a, b) => b.n - a.n)
  }, [index])

  const filtered = useMemo(() => {
    if (!sortedTerms) return []
    if (!search) return sortedTerms
    const q = search.toLowerCase()
    return sortedTerms.filter((t) => t.term.toLowerCase().includes(q))
  }, [sortedTerms, search])

  if (error) return <ErrorBox error={error} />
  if (!index) return <Loading what="cell type index" />

  // Detail view
  if (term && index[term]) {
    const entry = index[term]
    return (
      <div>
        <div className="text-xs text-slate-500 mb-2">
          <Link to="/celltypes" className="hover:text-brand-300">Cell types</Link> / <span>{term}</span>
        </div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-50 tracking-tight">{term}</h1>
          <p className="text-slate-400 mt-2">
            <span className="text-brand-300">{entry.n_features}</span> SAE features have this as their top{' '}
            <span className="font-mono">{entry.library}</span> hit (FDR &lt; 0.05).
          </p>
        </div>

        <div className="card !p-0 overflow-hidden">
          <table className="atlas">
            <thead>
              <tr>
                <th>surface</th>
                <th>idx</th>
                <th>label</th>
                <th>FDR</th>
              </tr>
            </thead>
            <tbody>
              {entry.features.map((f, i) => (
                <tr key={i}>
                  <td>
                    <span className={f.s === 'aggregator' ? 'pill-blue' : 'pill-purple'}>{f.s}</span>
                  </td>
                  <td className="font-mono text-xs text-slate-500">
                    <Link to={`/surface/${f.s}/feature/${f.i}`} className="hover:text-brand-300">
                      f{f.i}
                    </Link>
                  </td>
                  <td>
                    <Link to={`/surface/${f.s}/feature/${f.i}`} className="font-semibold text-slate-100 hover:text-brand-300">
                      {f.lb || 'Unannotated'}
                    </Link>
                  </td>
                  <td className="font-mono text-xs text-brand-300">{fmtSci(f.fdr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Index view
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-50 tracking-tight">Cell types</h1>
        <p className="text-slate-400 mt-2 max-w-3xl">
          <span className="text-brand-300">{sortedTerms.length}</span> distinct PanglaoDB cell types
          appear as the top hit for at least one aggregator or cell_embedder SAE feature. Sorted by
          number of features per type.
        </p>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Filter cell types…"
        className="input mb-6 max-w-md"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((t) => (
          <Link
            key={t.term}
            to={`/celltypes/${encodeURIComponent(t.term)}`}
            className="card-hover block"
          >
            <div className="font-semibold text-slate-100 leading-tight">{t.term}</div>
            <div className="text-xs text-slate-500 mt-2 flex items-center gap-2">
              <span className="text-brand-300 font-mono">{t.n}</span>
              <span>features</span>
              <span className="text-slate-700">·</span>
              <span className="font-mono text-[10px]">{t.library}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function fmtSci(x) {
  if (x == null || isNaN(x)) return '—'
  if (x === 0) return '0'
  const exp = Math.floor(Math.log10(x))
  const mant = x / Math.pow(10, exp)
  return `${mant.toFixed(1)}e${exp}`
}
