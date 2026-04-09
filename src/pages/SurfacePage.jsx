import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getFeatureTable, getSurfaces } from '../lib/data.js'
import { Loading, ErrorBox } from '../components/Loading.jsx'
import { InfoIcon } from '../components/Tooltip.jsx'

const SURFACE_BLURBS = {
  cell_embedder: 'Pre-graph gene-projection layer. SAE features here capture clean cell-type identities (the gene-program stratum).',
  aggregator: "Cell-in-niche aggregator pool — the canonical 64-dim representation, bit-equal to obsm['novae_latent']. SAE features here represent spatial niches.",
}

export default function SurfacePage() {
  const { name } = useParams()
  const navigate = useNavigate()
  const [surface, setSurface] = useState(null)
  const [features, setFeatures] = useState(null)
  const [error, setError] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [tissueFilter, setTissueFilter] = useState('')
  const [techFilter, setTechFilter] = useState('')
  const [niche20Filter, setNiche20Filter] = useState('')
  const [aliveOnly, setAliveOnly] = useState(true)
  const [minSig, setMinSig] = useState(0)

  // Sort — default to significance for surfaces that have it
  const [sortBy, setSortBy] = useState('sig')
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
    if (minSig > 0) xs = xs.filter((f) => (f.sig || 0) >= minSig)
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
  }, [features, aliveOnly, minSig, tissueFilter, techFilter, niche20Filter, search])

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

      {SURFACE_BLURBS[name] && (
        <p className="text-sm text-slate-400 max-w-3xl mb-6 leading-relaxed">
          {SURFACE_BLURBS[name]}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <Stat
          label="features"
          value={surface.n_features?.toLocaleString()}
          tip="Number of SAE dictionary elements (one row per feature in the table below). Each is a learned sparse direction in this surface's activation space."
        />
        <Stat
          label="alive"
          value={surface.alive?.toLocaleString()}
          tip="Features that fire on at least one cell. Dead features never activate and are excluded from analysis."
        />
        <Stat
          label="d"
          value={surface.d ?? '—'}
          tip="Dimension of the activation vector at this surface. The SAE expands d into many more sparse features (32× expansion factor here)."
        />
        <Stat
          label="var exp"
          value={surface.var_exp_full?.toFixed(3) ?? '—'}
          tip="Fraction of the original activation variance that the SAE reconstruction captures. 1.0 = perfect. The aggregator reaches 0.998; conv layers range 0.81–0.94."
        />
        <Stat
          label="superposition"
          value={surface.superposition?.toFixed(3) ?? '—'}
          tip="Fraction of features that are NOT aligned with the top-50 SVD directions (cosine 0.7 threshold). Close to 1.0 means linear methods like PCA cannot find these features — a feature dictionary is essential."
        />
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
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 flex-wrap">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={aliveOnly}
              onChange={(e) => setAliveOnly(e.target.checked)}
              className="accent-brand-500"
            />
            alive only
          </label>
          {hasBio && (
            <label className="flex items-center gap-2 grow max-w-xs">
              <span className="text-slate-400">min sig</span>
              <input
                type="range"
                min={0} max={60} step={1}
                value={minSig}
                onChange={(e) => { setMinSig(Number(e.target.value)); setPage(0) }}
                className="grow accent-brand-500"
              />
              <span className="font-mono text-brand-300 w-8 text-right">{minSig}</span>
            </label>
          )}
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
              {hasBio && <Th col="sig" label="sig" sortBy={sortBy} sortDir={sortDir} setSort={(c, d) => { setSortBy(c); setSortDir(d) }} />}
              {hasBio && <Th col="lb" label="label" sortBy={sortBy} sortDir={sortDir} setSort={(c, d) => { setSortBy(c); setSortDir(d) }} />}
              {hasBio && <Th col="top_genes" label="top genes" sortBy={sortBy} sortDir={sortDir} setSort={(c, d) => { setSortBy(c); setSortDir(d) }} />}
              {hasDomain && <Th col="top_domain_l20_lb" label="niche" sortBy={sortBy} sortDir={sortDir} setSort={(c, d) => { setSortBy(c); setSortDir(d) }} />}
              {hasDomain && <Th col="top_domain_l20_log2enr" label="log₂ enr" sortBy={sortBy} sortDir={sortDir} setSort={(c, d) => { setSortBy(c); setSortDir(d) }} />}
              <Th col="top_tissue" label="tissue" sortBy={sortBy} sortDir={sortDir} setSort={(c, d) => { setSortBy(c); setSortDir(d) }} />
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paged.map((f) => (
              <tr
                key={f.feature_idx}
                className="cursor-pointer"
                onClick={() => navigate(`/surface/${name}/feature/${f.feature_idx}`)}
              >
                <td className="font-mono text-xs text-brand-300">
                  {f.feature_idx}
                </td>
                {hasBio && (
                  <td className="font-mono tabular-nums">
                    <SigBadge sig={f.sig} />
                  </td>
                )}
                {hasBio && (
                  <td>
                    <div className="font-semibold text-slate-100 leading-tight">
                      {f.lb || '—'}
                    </div>
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
                {hasDomain && (
                  <td>
                    {f.top_domain_l20_lb ? (
                      <div>
                        <div className="text-slate-200 leading-tight">{f.top_domain_l20_lb}</div>
                        <div className="text-[10px] font-mono text-slate-500">{f.top_domain_l20}</div>
                      </div>
                    ) : (
                      <span className="font-mono text-slate-500">{f.top_domain_l20 || '—'}</span>
                    )}
                  </td>
                )}
                {hasDomain && (
                  <td className="font-mono tabular-nums text-slate-300">
                    {f.top_domain_l20_log2enr != null ? f.top_domain_l20_log2enr.toFixed(2) : '—'}
                  </td>
                )}
                <td>
                  {f.top_tissue ? <span className="pill-slate">{f.top_tissue}</span> : '—'}
                </td>
                <td className="text-right text-brand-400 text-xs">→</td>
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

function Stat({ label, value, tip }) {
  return (
    <div className="card !p-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center">
        {label}
        {tip && <InfoIcon tip={tip} />}
      </div>
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

function SigBadge({ sig }) {
  const v = sig ?? 0
  let cls = 'text-slate-500'
  if (v >= 50) cls = 'text-emerald-300 font-bold'
  else if (v >= 30) cls = 'text-emerald-400'
  else if (v >= 15) cls = 'text-brand-300'
  return <span className={cls}>{v.toFixed(0)}</span>
}

function fmtSci(x) {
  if (x == null || isNaN(x)) return '—'
  if (x === 0) return '0'
  const exp = Math.floor(Math.log10(x))
  const mant = x / Math.pow(10, exp)
  return `${mant.toFixed(1)}e${exp}`
}
