import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCausalAudit } from '../lib/data.js'
import { Loading, ErrorBox } from '../components/Loading.jsx'

export default function CausalAuditPage() {
  const [audit, setAudit] = useState(null)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sortKey, setSortKey] = useState('dep_self_loop_norm')
  const [limit, setLimit] = useState(100)

  useEffect(() => {
    getCausalAudit()
      .then((d) => { if (d && typeof d === 'object') setAudit(d); else setError(new Error('Invalid data')); })
      .catch((e) => setError(e))
  }, [])

  if (error) return <ErrorBox error={error} />
  if (!audit) return <Loading what="causal audit" />

  const hyp = (audit && typeof audit.hypotheses === 'object') ? audit.hypotheses : {}
  const rows = Array.isArray(audit.per_feature_table) ? audit.per_feature_table : []

  return (
    <div>
      <div className="text-xs text-slate-500 mb-2">
        <Link to="/" className="hover:text-brand-300">Overview</Link> / Causal audit
      </div>
      <h1 className="text-3xl font-bold text-slate-50 tracking-tight mb-2">Causal audit</h1>
      <p className="text-slate-400 max-w-3xl leading-relaxed mb-8">
        Phase-4 validation of every aggregator feature against the pre-registered hypotheses.
      </p>

      {/* Hypothesis cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {Object.entries(hyp).map(([key, h]) => (
          <HypothesisCard key={key} id={key} h={h} />
        ))}
      </div>

      {/* Per-feature table */}
      <FeatureTable
        rows={rows}
        search={search}
        setSearch={setSearch}
        filter={filter}
        setFilter={setFilter}
        sortKey={sortKey}
        setSortKey={setSortKey}
        limit={limit}
        setLimit={setLimit}
      />
    </div>
  )
}

function FeatureTable({ rows, search, setSearch, filter, setFilter, sortKey, setSortKey, limit, setLimit }) {
  const filteredRows = useMemo(() => {
    let r = rows
    if (search) {
      const q = search.toLowerCase()
      r = r.filter((x) =>
        String(safe(x.feature_idx)).includes(q) ||
        String(safe(x.label)).toLowerCase().includes(q) ||
        String(safe(x.top_tissue)).toLowerCase().includes(q) ||
        String(safe(x.top_domain_l7)).toLowerCase().includes(q)
      )
    }
    if (filter === 'graph_dependent') r = r.filter((x) => num(x.dep_self_loop_norm) > 0.5)
    else if (filter === 'tech_specific') r = r.filter((x) => x.tech_specific === true)
    else if (filter === 'survivors') r = r.filter((x) => x.survives_all === true)
    else if (filter === 'causally_active') r = r.filter((x) => num(x.proto_reassign_rate) > 0.2)

    return [...r].sort((a, b) => {
      const av = num(a[sortKey], -1e9)
      const bv = num(b[sortKey], -1e9)
      if (av === bv) return (a.feature_idx || 0) - (b.feature_idx || 0)
      return bv - av
    })
  }, [rows, search, filter, sortKey])

  const visible = filteredRows.slice(0, limit)

  return (
    <>
      <h2 className="text-xl font-bold text-slate-100 mb-3">Per-feature causal table</h2>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input type="text" placeholder="search..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-100 text-xs min-w-[200px]" />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="px-2 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-xs">
          <option value="all">all features</option>
          <option value="graph_dependent">graph-dependent (dep &gt; 0.5)</option>
          <option value="tech_specific">tech-specific</option>
          <option value="survivors">confound survivors</option>
          <option value="causally_active">proto reassign &gt; 20%</option>
        </select>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}
          className="px-2 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-xs">
          <option value="dep_self_loop_norm">sort: dep (norm)</option>
          <option value="dep_random_rewire">sort: dep (rewire)</option>
          <option value="morans_i_mean">sort: Moran's I</option>
          <option value="proto_reassign_rate">sort: proto reassign</option>
          <option value="tissue_max_ratio">sort: tissue ratio</option>
        </select>
        <span className="text-xs text-slate-500">{filteredRows.length} / {rows.length}</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/40">
        <table className="w-full text-xs">
          <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="text-left px-2 py-2">feat</th>
              <th className="text-left px-2 py-2">label</th>
              <th className="text-left px-2 py-2">tissue</th>
              <th className="text-right px-2 py-2">Moran's I</th>
              <th className="text-right px-2 py-2">dep (norm)</th>
              <th className="text-right px-2 py-2">dep (rewire)</th>
              <th className="text-right px-2 py-2">tissue x</th>
              <th className="text-right px-2 py-2">tech x</th>
              <th className="text-right px-2 py-2">proto reassign</th>
              <th className="text-center px-2 py-2">survives</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {visible.map((r) => (
              <tr key={r.feature_idx} className="hover:bg-slate-800/40 transition">
                <td className="px-2 py-1.5 font-mono text-brand-300">
                  <Link to={'/surface/aggregator/feature/' + r.feature_idx} className="hover:underline">
                    {safe(r.feature_idx)}
                  </Link>
                </td>
                <td className="px-2 py-1.5 text-slate-200 truncate max-w-[200px]">{safe(r.label, '\u2014')}</td>
                <td className="px-2 py-1.5 text-slate-400">{safe(r.top_tissue, '\u2014')}</td>
                <td className="px-2 py-1.5 text-right font-mono text-slate-300">{fmt(r.morans_i_mean, 3)}</td>
                <td className={'px-2 py-1.5 text-right font-mono ' + depColor(r.dep_self_loop_norm)}>{fmt(r.dep_self_loop_norm, 3)}</td>
                <td className={'px-2 py-1.5 text-right font-mono ' + depColor(r.dep_random_rewire)}>{fmt(r.dep_random_rewire, 3)}</td>
                <td className="px-2 py-1.5 text-right font-mono text-slate-400">{fmt(r.tissue_max_ratio, 2)}</td>
                <td className="px-2 py-1.5 text-right font-mono text-slate-400">{fmt(r.tech_max_ratio, 2)}</td>
                <td className="px-2 py-1.5 text-right font-mono text-slate-300">{pct(r.proto_reassign_rate)}</td>
                <td className="px-2 py-1.5 text-center">
                  {r.survives_all === true
                    ? <span className="text-emerald-400">{'✓'}</span>
                    : <span className="text-slate-700">{'\u00B7'}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRows.length > limit && (
        <div className="mt-4 flex justify-center">
          <button onClick={() => setLimit(limit + 100)}
            className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition">
            {'show ' + Math.min(100, filteredRows.length - limit) + ' more'}
          </button>
        </div>
      )}
    </>
  )
}

function HypothesisCard({ id, h }) {
  if (!h || typeof h !== 'object') return null
  const verdict = String(h.verdict || 'PENDING')
  const isConfirmed = verdict === 'CONFIRMED'
  const title = String(id || '')
    .replace(/^H(\d+)_/, 'H$1 \u00B7 ')
    .replace(/_/g, ' ')

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="text-sm font-semibold text-slate-100">{title}</div>
        <span className={isConfirmed
          ? 'text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ring-1 bg-emerald-500/10 text-emerald-300 ring-emerald-500/30'
          : 'text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ring-1 bg-rose-500/10 text-rose-300 ring-rose-500/30'
        }>
          {verdict}
        </span>
      </div>
      <div className="text-[11px] text-slate-400 leading-snug mb-3">{safe(h.claim)}</div>
      <dl className="text-[11px] space-y-1">
        {Object.entries(h)
          .filter(([k]) => k !== 'claim' && k !== 'verdict' && k !== 'note')
          .map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <dt className="text-slate-500 font-mono">{String(k)}</dt>
              <dd className="text-slate-200 font-mono">{fmtHyp(v)}</dd>
            </div>
          ))}
      </dl>
      {h.note && <div className="mt-2 text-[10px] text-amber-400/80 italic">{'note: ' + String(h.note)}</div>}
    </div>
  )
}

// Safe value helpers — NEVER return objects, always strings
function safe(v, fallback) {
  if (v == null || v === '' || (typeof v === 'number' && !isFinite(v))) return fallback || ''
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function num(v, fallback) {
  if (v == null || typeof v !== 'number' || !isFinite(v)) return fallback != null ? fallback : 0
  return v
}

function fmt(v, digits) {
  if (v == null || typeof v !== 'number' || !isFinite(v)) return '\u2014'
  return v.toFixed(digits || 2)
}

function pct(v) {
  if (v == null || typeof v !== 'number' || !isFinite(v)) return '\u2014'
  return Math.round(v * 100) + '%'
}

function fmtHyp(v) {
  if (v == null) return '\u2014'
  if (typeof v === 'boolean') return v ? 'yes' : 'no'
  if (typeof v === 'number') return isFinite(v) ? (Math.abs(v) < 1 ? v.toFixed(4) : v.toFixed(2)) : '\u2014'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function depColor(v) {
  if (v == null || typeof v !== 'number') return 'text-slate-500'
  if (v > 0.5) return 'text-emerald-400'
  if (v > 0.2) return 'text-emerald-600'
  if (v > -0.2) return 'text-slate-400'
  return 'text-rose-400'
}
