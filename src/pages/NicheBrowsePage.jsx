import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getNicheIndex, getFeatureTable } from '../lib/data.js'
import { Loading, ErrorBox } from '../components/Loading.jsx'

export default function NicheBrowsePage() {
  const { level, niche } = useParams()
  const [index, setIndex] = useState(null)
  const [aggLb, setAggLb] = useState({})
  const [error, setError] = useState(null)
  const [activeLevel, setActiveLevel] = useState(level || 'level_20')
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([getNicheIndex(), getFeatureTable('aggregator')])
      .then(([idx, agg]) => {
        setIndex(idx)
        const lk = {}
        for (const f of agg) lk[f.feature_idx] = f.lb
        setAggLb(lk)
      })
      .catch(setError)
  }, [])

  useEffect(() => {
    if (level) setActiveLevel(level)
  }, [level])

  const niches = useMemo(() => {
    if (!index) return []
    const lvl = index[activeLevel] || {}
    return Object.entries(lvl)
      .map(([k, v]) => ({
        niche: k,
        lb: v.lb,
        n: v.n_features,
        tissues: Object.keys(v.top_tissues || {}),
      }))
      .sort((a, b) => b.n - a.n)
  }, [index, activeLevel])

  const filtered = useMemo(() => {
    if (!search) return niches
    const q = search.toLowerCase()
    return niches.filter(
      (n) =>
        n.niche.toLowerCase().includes(q) ||
        (n.lb || '').toLowerCase().includes(q) ||
        n.tissues.some((t) => t.toLowerCase().includes(q)),
    )
  }, [niches, search])

  if (error) return <ErrorBox error={error} />
  if (!index) return <Loading what="niche index" />

  // Detail view
  if (level && niche && index[level] && index[level][niche]) {
    const entry = index[level][niche]
    return (
      <div>
        <div className="text-xs text-slate-500 mb-2">
          <Link to="/niches" className="hover:text-brand-300">Niches</Link> /{' '}
          <span className="font-mono">{level}</span> / <span className="font-mono">{niche}</span>
        </div>
        <div className="mb-6">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-slate-50 tracking-tight">{entry.lb}</h1>
            <span className="font-mono text-slate-500">niche {niche}</span>
          </div>
          <p className="text-slate-400 mt-2">
            <span className="text-brand-300">{entry.n_features}</span> aggregator SAE features prefer this niche.
            Top tissues:{' '}
            {Object.keys(entry.top_tissues).slice(0, 5).map((t, i, arr) => (
              <span key={t}>
                <span className="pill-slate ml-1">{t}</span>
                {i < arr.length - 1 ? '' : ''}
              </span>
            ))}
          </p>
        </div>

        <div className="card !p-0 overflow-hidden">
          <table className="atlas">
            <thead>
              <tr>
                <th>idx</th>
                <th>label</th>
                <th>frac</th>
                <th>log₂ enr</th>
                <th>FDR</th>
              </tr>
            </thead>
            <tbody>
              {entry.features.map((f, i) => (
                <tr key={i}>
                  <td className="font-mono text-xs text-slate-500">
                    <Link to={`/surface/aggregator/feature/${f.i}`} className="hover:text-brand-300">
                      f{f.i}
                    </Link>
                  </td>
                  <td>
                    <Link
                      to={`/surface/aggregator/feature/${f.i}`}
                      className="font-semibold text-slate-100 hover:text-brand-300"
                    >
                      {aggLb[f.i] || 'Unannotated'}
                    </Link>
                  </td>
                  <td className="font-mono tabular-nums text-slate-300">
                    {(f.frac * 100).toFixed(1)}%
                  </td>
                  <td className="font-mono tabular-nums text-brand-300">
                    {f.log2enr.toFixed(2)}
                  </td>
                  <td className="font-mono text-xs text-slate-500">{fmtSci(f.fdr)}</td>
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
        <h1 className="text-3xl font-bold text-slate-50 tracking-tight">Novae niches</h1>
        <p className="text-slate-400 mt-2 max-w-3xl">
          Hierarchical spatial niches discovered by Novae's SwAV head, indexed by which aggregator
          SAE features prefer them. Each niche label is auto-derived from the dominant feature's
          PanglaoDB cell-type hit. <span className="text-brand-300">No analogue in single-cell
          atlases</span> — niches are the unique Novae contribution.
        </p>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-[10px] uppercase tracking-wider text-slate-500 mr-1">level</span>
        {['level_7', 'level_12', 'level_20'].map((lvl) => (
          <button
            key={lvl}
            onClick={() => setActiveLevel(lvl)}
            className={
              activeLevel === lvl
                ? 'pill-blue !text-xs !py-1 !px-3'
                : 'pill-slate !text-xs !py-1 !px-3 hover:bg-slate-700'
            }
          >
            {lvl.replace('_', ' ')} ({Object.keys(index[lvl] || {}).length})
          </button>
        ))}
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Filter by niche label, code, or tissue…"
        className="input mb-6 max-w-md"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((n) => (
          <Link
            key={n.niche}
            to={`/niches/${activeLevel}/${n.niche}`}
            className="card-hover block"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-xs text-slate-500">{n.niche}</span>
              <span className="text-[10px] text-brand-300 font-mono">{n.n} feats</span>
            </div>
            <div className="font-semibold text-slate-100 leading-tight">{n.lb || 'Unannotated'}</div>
            <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1 flex-wrap">
              {n.tissues.slice(0, 4).map((t) => (
                <span key={t} className="pill-slate !text-[9px] !py-0.5">{t}</span>
              ))}
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
