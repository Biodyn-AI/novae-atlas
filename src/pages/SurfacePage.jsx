import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getFeatureTable, getSurfaces } from '../lib/data.js'
import { Loading, ErrorBox } from '../components/Loading.jsx'

export default function SurfacePage() {
  const { name } = useParams()
  const [surface, setSurface] = useState(null)
  const [features, setFeatures] = useState(null)
  const [error, setError] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [tissueFilter, setTissueFilter] = useState('')
  const [techFilter, setTechFilter] = useState('')
  const [niche20Filter, setNiche20Filter] = useState('')
  const [aliveOnly, setAliveOnly] = useState(true)

  // Sort
  const [sortBy, setSortBy] = useState('mean_abs')
  const [sortDir, setSortDir] = useState('desc')

  // Pagination
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  useEffect(() => {
    setFeatures(null)
    setError(null)
    setPage(0)
    Promise.all([getSurfaces(), getFeatureTable(name)])
      .then(([surfaces, feats]) => {
        const surfaceMeta = surfaces.find((s) => s.name === name)
        setSurface(surfaceMeta)
        setFeatures(feats)
      })
      .catch(setError)
  }, [name])

  const tissues = useMemo(() => uniqueValues(features, 'top_tissue'), [features])
  const techs = useMemo(() => uniqueValues(features, 'top_tech'), [features])
  const niches = useMemo(() => uniqueValues(features, 'top_domain_l20'), [features])

  const filtered = useMemo(() => {
    if (!features) return []
    let xs = features
    if (aliveOnly) xs = xs.filter((f) => f.alive)
    if (tissueFilter) xs = xs.filter((f) => f.top_tissue === tissueFilter)
    if (techFilter) xs = xs.filter((f) => f.top_tech === techFilter)
    if (niche20Filter) xs = xs.filter((f) => f.top_domain_l20 === niche20Filter)
    if (search) {
      const s = search.toLowerCase()
      xs = xs.filter((f) => {
        return (
          String(f.feature_idx).includes(s) ||
          (f.lb || '').toLowerCase().includes(s) ||
          (f.top_genes || '').toLowerCase().includes(s) ||
          (f.top_PanglaoDB_v2 || '').toLowerCase().includes(s) ||
          (f.top_CellMarker_v2 || '').toLowerCase().includes(s) ||
          (f.top_GO_BP_v2 || '').toLowerCase().includes(s) ||
          (f.top_domain_l20 || '').toLowerCase().includes(s)
        )
      })
    }
    return xs
  }, [features, aliveOnly, tissueFilter, techFilter, niche20Filter, search])

  const sorted = useMemo(() => {
    const xs = [...filtered]
    xs.sort((a, b) => {
      const av = a[sortBy]
      const bv = b[sortBy]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av))
    })
    return xs
  }, [filtered, sortBy, sortDir])

  const paged = useMemo(
    () => sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [sorted, page],
  )

  if (error) return <ErrorBox error={error} />
  if (!features || !surface) return <Loading what={`${name} feature table`} />

  const hasBio = surface.has_bio
  const hasDomain = surface.has_domains

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <div className="text-xs text-slate-500 mb-1">
            <Link to="/surfaces" className="hover:text-brand-300">Surfaces</Link>{' '}/
          </div>
          <h1 className="text-3xl font-bold text-slate-50 font-mono">{name}</h1>
        </div>
        <Link to={`/surface/${name}/modules`} className="btn">
          Modules ({surface.n_modules ?? '?'})
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <Stat label="features" value={surface.n_features?.toLocaleString()} />
        <Stat label="alive" value={surface.alive?.toLocaleString()} />
        <Stat label="d" value={surface.d} />
        <Stat label="var exp" value={surface.var_exp_full?.toFixed(3) ?? '—'} />
        <Stat label="superposition" value={surface.superposition?.toFixed(3) ?? '—'} />
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0) }}
              placeholder="cell type, gene, niche, idx…"
              className="input"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Top tissue
            </label>
            <select
              value={tissueFilter}
              onChange={(e) => { setTissueFilter(e.target.value); setPage(0) }}
              className="input"
            >
              <option value="">all</option>
              {tissues.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Top tech
            </label>
            <select
              value={techFilter}
              onChange={(e) => { setTechFilter(e.target.value); setPage(0) }}
              className="input"
            >
              <option value="">all</option>
              {techs.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {hasDomain && (
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Top niche (l20)
              </label>
              <select
                value={niche20Filter}
                onChange={(e) => { setNiche20Filter(e.target.value); setPage(0) }}
                className="input"
              >
                <option value="">all</option>
                {niches.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={aliveOnly}
              onChange={(e) => setAliveOnly(e.target.checked)}
              className="accent-brand-500"
            />
            alive only
          </label>
          <span>·</span>
          <span>{filtered.length.toLocaleString()} of {features.length.toLocaleString()} features</span>
        </div>
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-x-auto">
        <table className="atlas">
          <thead>
            <tr>
              <Th col="feature_idx" label="idx" sortBy={sortBy} sortDir={sortDir} setSort={(c, d) => { setSortBy(c); setSortDir(d) }} />
              {hasBio && <Th col="lb" label="label" sortBy={sortBy} sortDir={sortDir} setSort={(c, d) => { setSortBy(c); setSortDir(d) }} />}
              {hasBio && <Th col="top_genes" label="top genes" sortBy={sortBy} sortDir={sortDir} setSort={(c, d) => { setSortBy(c); setSortDir(d) }} />}
              {hasDomain && <Th col="top_domain_l20" label="niche l20" sortBy={sortBy} sortDir={sortDir} setSort={(c, d) => { setSortBy(c); setSortDir(d) }} />}
              {hasDomain && <Th col="top_domain_l20_log2enr" label="log₂ enr" sortBy={sortBy} sortDir={sortDir} setSort={(c, d) => { setSortBy(c); setSortDir(d) }} />}
              <Th col="mean_abs" label="mean |a|" sortBy={sortBy} sortDir={sortDir} setSort={(c, d) => { setSortBy(c); setSortDir(d) }} />
              <Th col="top_tissue" label="tissue" sortBy={sortBy} sortDir={sortDir} setSort={(c, d) => { setSortBy(c); setSortDir(d) }} />
            </tr>
          </thead>
          <tbody>
            {paged.map((f) => (
              <tr key={f.feature_idx}>
                <td className="font-mono text-xs text-slate-500">
                  <Link to={`/surface/${name}/feature/${f.feature_idx}`} className="hover:text-brand-300">
                    {f.feature_idx}
                  </Link>
                </td>
                {hasBio && (
                  <td>
                    <Link
                      to={`/surface/${name}/feature/${f.feature_idx}`}
                      className="font-semibold text-slate-100 hover:text-brand-300 leading-tight block"
                    >
                      {f.lb || '—'}
                    </Link>
                    {f.top_PanglaoDB_v2_fdr != null && f.top_PanglaoDB_v2_fdr < 0.05 && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        FDR {fmtSci(f.top_PanglaoDB_v2_fdr)}
                      </span>
                    )}
                  </td>
                )}
                {hasBio && (
                  <td className="font-mono text-[11px] text-slate-400 max-w-xs">
                    {(f.top_genes || '').toUpperCase() || '—'}
                  </td>
                )}
                {hasDomain && <td className="font-mono text-slate-300">{f.top_domain_l20 || '—'}</td>}
                {hasDomain && (
                  <td className="font-mono tabular-nums text-slate-300">
                    {f.top_domain_l20_log2enr != null ? f.top_domain_l20_log2enr.toFixed(2) : '—'}
                  </td>
                )}
                <td className="font-mono tabular-nums text-slate-400">{f.mean_abs?.toFixed(4) ?? '—'}</td>
                <td>
                  {f.top_tissue ? <span className="pill-slate">{f.top_tissue}</span> : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="text-slate-500">
          page {page + 1} of {Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))}
        </div>
        <div className="flex items-center gap-2">
          <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="btn">
            ← Prev
          </button>
          <button
            disabled={(page + 1) * PAGE_SIZE >= sorted.length}
            onClick={() => setPage((p) => p + 1)}
            className="btn"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}

function Th({ col, label, sortBy, sortDir, setSort }) {
  const active = sortBy === col
  return (
    <th
      onClick={() => {
        if (active) setSort(col, sortDir === 'asc' ? 'desc' : 'asc')
        else setSort(col, 'desc')
      }}
      className="cursor-pointer select-none"
    >
      <span className={active ? 'text-brand-300' : ''}>
        {label} {active ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </span>
    </th>
  )
}

function Stat({ label, value }) {
  return (
    <div className="card !p-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-base font-semibold text-slate-100 tabular-nums">{value ?? '—'}</div>
    </div>
  )
}

function uniqueValues(features, key) {
  if (!features) return []
  const set = new Set()
  for (const f of features) if (f[key]) set.add(f[key])
  return Array.from(set).sort()
}

function fmtSci(x) {
  if (x == null || isNaN(x)) return '—'
  if (x === 0) return '0'
  const exp = Math.floor(Math.log10(x))
  const mant = x / Math.pow(10, exp)
  return `${mant.toFixed(1)}e${exp}`
}
