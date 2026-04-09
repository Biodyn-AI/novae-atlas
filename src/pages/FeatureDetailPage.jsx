import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Plot from 'react-plotly.js'
import {
  getFeatureDetail,
  getFeatureSpatial,
  getSlideBackground,
  getSlides,
} from '../lib/data.js'
import { Loading, ErrorBox } from '../components/Loading.jsx'
import { InfoIcon } from '../components/Tooltip.jsx'

const LIB_LABELS = {
  GO_Biological_Process_2023: 'GO BP',
  KEGG_2021_Human: 'KEGG',
  Reactome_2022: 'Reactome',
  PanglaoDB_Augmented_2021: 'PanglaoDB',
  CellMarker_Augmented_2021: 'CellMarker',
}

export default function FeatureDetailPage() {
  const { name, idx } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setData(null); setError(null)
    getFeatureDetail(name, idx).then(setData).catch(setError)
  }, [name, idx])

  if (error) return <ErrorBox error={error} />
  if (!data) return <Loading what={`feature ${name}/${idx}`} />

  const hasDomains = data.domains && Object.keys(data.domains).length > 0
  const hasSpatial = name === 'aggregator'

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-xs text-slate-500 mb-2 flex items-center gap-2">
        <Link to="/surfaces" className="hover:text-brand-300">Surfaces</Link>
        <span>/</span>
        <Link to={`/surface/${name}`} className="hover:text-brand-300 font-mono">{name}</Link>
        <span>/</span>
        <span className="font-mono">f{data.feature_idx}</span>
      </div>

      {/* Big label header */}
      <div className="mb-6">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-1">
          <h1 className="text-4xl font-bold text-slate-50 leading-tight tracking-tight">
            {data.lb || 'Unannotated'}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <PrevNext name={name} idx={Number(idx)} />
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-400 flex-wrap mt-2">
          <span className="font-mono text-brand-400">{name}</span>
          <span className="text-slate-600">·</span>
          <span className="font-mono">f{data.feature_idx}</span>
          {data.top_tissue && (
            <>
              <span className="text-slate-600">·</span>
              <span className="pill-slate">{data.top_tissue}</span>
            </>
          )}
          {data.top_tech && <span className="pill-slate">{data.top_tech}</span>}
          {data.tech_confound && <span className="pill-amber">tech-confounded</span>}
          {data.module && (
            <>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">module #{data.module.module_id}</span>
            </>
          )}
        </div>
      </div>

      {data._slim_only && (
        <div className="card mb-6 border-amber-500/30 bg-amber-500/5">
          <div className="text-sm text-amber-200">
            This surface ({name}) does not carry per-feature biological annotation. Bio
            characterization (top genes, Enrichr libraries, niche enrichment) is computed only for
            the headline <span className="font-mono">aggregator</span> and{' '}
            <span className="font-mono">cell_embedder</span> surfaces.
          </div>
        </div>
      )}

      {/* How to read this — expandable explainer */}
      {!data._slim_only && (
        <details className="card mb-6 border-slate-700">
          <summary className="cursor-pointer text-sm font-semibold text-slate-200 list-none flex items-center gap-2">
            <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How to read this page
            <span className="text-xs text-slate-500 ml-auto">click to expand</span>
          </summary>
          <div className="mt-4 grid sm:grid-cols-2 gap-3 text-xs text-slate-400 leading-relaxed">
            <div>
              <div className="font-semibold text-slate-200 mb-0.5">Label (header)</div>
              What we think this feature represents — auto-derived from the cell-type databases
              below. Treat it as a hypothesis, not a fact.
            </div>
            <div>
              <div className="font-semibold text-slate-200 mb-0.5">Top genes</div>
              The 20 genes most enriched in this feature's top-1% cells, ranked by fold-change vs
              corpus baseline. These are the marker genes the feature fires on.
            </div>
            <div>
              <div className="font-semibold text-slate-200 mb-0.5">Enrichr libraries</div>
              5 independent cell-type / pathway databases. Each tests whether the top genes match
              a known concept. Multiple agreeing databases → high confidence.
            </div>
            <div>
              <div className="font-semibold text-slate-200 mb-0.5">Novae niches</div>
              How the feature's top cells distribute across Novae's own self-discovered hierarchical
              niches. A high concentration in a single niche means the model itself converged on
              the same concept.
            </div>
            <div>
              <div className="font-semibold text-slate-200 mb-0.5">Distribution</div>
              Top tissue and technology of the top cells. If "tech-confounded" shows up, the
              feature may reflect technology bias rather than biology.
            </div>
            <div>
              <div className="font-semibold text-slate-200 mb-0.5">Spatial projection</div>
              Where on a real tissue slide the top cells live. A real anatomical feature will
              localize to a coherent region; a noise feature will scatter.
            </div>
          </div>
        </details>
      )}

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Stat
          label="alive"
          value={data.alive ? 'yes' : 'no'}
          tip="Whether this feature ever fires on any cell in the test corpus. 'Dead' features (that never activate) are excluded from analysis. Almost all features here are alive."
        />
        <Stat
          label="active cells"
          value={data.n_active_cells?.toLocaleString()}
          tip="Number of distinct cells (out of 4.5M) where this feature has a non-zero activation. A feature with high active-cell count fires broadly; one with few active cells fires only on a specific niche."
        />
        <Stat
          label="mean |a|"
          value={fmt4(data.mean_abs)}
          tip="Mean absolute activation strength across cells where this feature fires. Higher = the feature contributes a stronger signal when it does fire. Compare across features at the same surface."
        />
        <Stat
          label="max |a|"
          value={fmt4(data.max_abs)}
          tip="The single highest activation value this feature reached on any cell in the corpus. The 'top cells' below are the ones at or near this maximum."
        />
        {data.morans?.morans_i != null ? (
          <Stat
            label="Moran's I"
            value={fmt4(data.morans.morans_i)}
            sub={`on ${data.morans.slide}`}
            tip="Spatial autocorrelation — does this feature light up neighboring cells together (high I) or scattered cells (low I)? Close to 1 = a real spatial pattern, close to 0 = scattered/noise. Computed only for the causal-validation subset of features."
          />
        ) : (
          <Stat
            label="module"
            value={data.module ? `#${data.module.module_id}` : '—'}
            tip="The co-activation module this feature belongs to. Modules are communities of features that fire on the same cells (Leiden clustering on the PMI co-activation graph). Click the Modules link from the surface page to see all modules and their members."
          />
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT — top genes */}
        <div className="lg:col-span-1">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2">
            Top genes
          </h2>
          <div className="card !p-0 overflow-hidden">
            <table className="atlas">
              <thead>
                <tr>
                  <th>#</th>
                  <th>gene</th>
                  {data.top_genes?.[0]?.fold_change != null && <th>FC</th>}
                  {data.top_genes?.[0]?.score != null && <th>score</th>}
                </tr>
              </thead>
              <tbody>
                {(data.top_genes || []).map((g) => (
                  <tr key={g.rank}>
                    <td className="font-mono text-xs text-slate-500">{g.rank + 1}</td>
                    <td className="font-mono font-semibold uppercase text-slate-100">{g.gene}</td>
                    {g.fold_change != null && (
                      <td className="font-mono tabular-nums text-xs text-brand-300">{g.fold_change.toFixed(1)}×</td>
                    )}
                    {g.score != null && (
                      <td className="font-mono tabular-nums text-xs text-brand-300">{g.score.toFixed(3)}</td>
                    )}
                  </tr>
                ))}
                {(!data.top_genes || data.top_genes.length === 0) && (
                  <tr><td colSpan={4} className="text-center text-slate-500 py-4 text-xs">No top genes</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MIDDLE+RIGHT — enrichment, niches, distribution */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enrichment */}
          {Object.keys(data.enrichments || {}).length > 0 && (
            <div>
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2">
                Enrichr libraries
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {Object.entries(data.enrichments).map(([lib, hit]) => (
                  <EnrichCard key={lib} lib={lib} hit={hit} />
                ))}
              </div>
            </div>
          )}

          {/* Niches */}
          {hasDomains && (
            <div>
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2">
                Novae niches
              </h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {Object.entries(data.domains).map(([k, dm]) => (
                  <NicheCard key={k} levelName={k} dm={dm} />
                ))}
              </div>
            </div>
          )}

          {/* Distribution */}
          <div>
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2">
              Distribution
            </h2>
            <div className="card grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Top tissue</div>
                <div className="flex items-center gap-2">
                  <span className="pill-slate">{data.top_tissue || '—'}</span>
                  <span className="font-mono text-xs text-slate-500">
                    {data.top_tissue_frac != null ? `${(data.top_tissue_frac * 100).toFixed(0)}%` : ''}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Top technology</div>
                <div className="flex items-center gap-2">
                  <span className="pill-slate">{data.top_tech || '—'}</span>
                  <span className="font-mono text-xs text-slate-500">
                    {data.top_tech_frac != null ? `${(data.top_tech_frac * 100).toFixed(0)}%` : ''}
                  </span>
                  {data.tech_confound && <span className="pill-amber">confounded</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Causal */}
          {(data.causal || data.morans) && (
            <div>
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2">
                Causal &amp; spatial
              </h2>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                {data.causal && (
                  <div className="card">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                      Ablation effect (cosine)
                    </div>
                    <div className="font-mono text-2xl font-bold tabular-nums text-slate-100">
                      {fmt4(data.causal.ablation_effect)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">on {data.causal.slide}</div>
                  </div>
                )}
                {data.morans && (
                  <div className="card">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                      Moran's I (spatial coherence)
                    </div>
                    <div className="font-mono text-2xl font-bold tabular-nums text-slate-100">
                      {fmt4(data.morans.morans_i)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      n_active = {data.morans.n_active.toLocaleString()} on {data.morans.slide}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* INLINE SPATIAL VIEW */}
      {hasSpatial && (
        <div className="mt-8">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2 flex items-center justify-between">
            <span>Spatial projection</span>
            <Link to={`/surface/${name}/feature/${idx}/spatial`} className="text-xs text-brand-300 hover:underline normal-case tracking-normal">
              Full view →
            </Link>
          </h2>
          <InlineSpatial surface={name} idx={idx} />
        </div>
      )}
    </div>
  )
}

function InlineSpatial({ surface, idx }) {
  const [topCells, setTopCells] = useState(null)
  const [bg, setBg] = useState(null)
  const [slideIdx, setSlideIdx] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setTopCells(null); setBg(null); setSlideIdx(null); setError(null)
    Promise.all([getFeatureSpatial(surface, idx), getSlides()])
      .then(([cells, slides]) => {
        setTopCells(cells)
        // Pick the slide with the most top cells
        const counts = {}
        for (const c of cells) counts[c.slide_idx] = (counts[c.slide_idx] || 0) + 1
        const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
        if (best) setSlideIdx(Number(best[0]))
      })
      .catch(setError)
  }, [surface, idx])

  useEffect(() => {
    if (slideIdx == null) return
    setBg(null)
    getSlideBackground(slideIdx).then(setBg).catch(setError)
  }, [slideIdx])

  if (error) return <ErrorBox error={error} />
  if (!topCells) return <Loading what="spatial" />
  if (topCells.length === 0) {
    return (
      <div className="card text-center text-slate-500 text-sm">
        This feature has no top cells with spatial coordinates.
      </div>
    )
  }
  if (!bg) return <Loading what="slide background" />

  const slideTop = topCells.filter((t) => t.slide_idx === slideIdx)

  return (
    <div className="card !p-3">
      <div className="pointer-events-none">
        <Plot
          data={[
            {
              type: 'scattergl',
              mode: 'markers',
              x: bg.x,
              y: bg.y,
              marker: { size: 1.8, color: '#334155', opacity: 0.6 },
              name: `${bg.tissue} background (${bg.n_cells_subsampled.toLocaleString()} of ${bg.n_cells_total.toLocaleString()})`,
              hoverinfo: 'skip',
            },
            {
              type: 'scattergl',
              mode: 'markers',
              x: slideTop.map((t) => t.x),
              y: slideTop.map((t) => t.y),
              marker: {
                size: 7,
                color: slideTop.map((t) => Math.abs(t.a)),
                colorscale: 'Inferno',
                showscale: true,
                colorbar: { title: '|a|', thickness: 10, len: 0.5, tickfont: { color: '#94a3b8', size: 9 }, titlefont: { color: '#cbd5e1', size: 10 } },
                line: { width: 0.4, color: '#0f172a' },
              },
              name: `top cells`,
            },
          ]}
          layout={{
            autosize: true,
            height: 480,
            paper_bgcolor: 'transparent',
            plot_bgcolor: '#020617',
            font: { color: '#cbd5e1', family: 'Inter, sans-serif', size: 11 },
            xaxis: { scaleanchor: 'y', showgrid: false, zeroline: false, showticklabels: false },
            yaxis: { showgrid: false, zeroline: false, autorange: 'reversed', showticklabels: false },
            margin: { l: 10, r: 10, t: 10, b: 30 },
            showlegend: true,
            legend: { orientation: 'h', y: -0.05, font: { size: 10 } },
            dragmode: false,
          }}
          config={{ displayModeBar: false, responsive: true, staticPlot: true, scrollZoom: false }}
          useResizeHandler
          style={{ width: '100%' }}
        />
      </div>
      <div className="text-[10px] text-slate-500 text-center pt-1">
        Click "Full view →" above for the interactive version on a different slide.
      </div>
    </div>
  )
}

function PrevNext({ name, idx }) {
  return (
    <div className="flex items-center gap-1">
      {idx > 0 && (
        <Link to={`/surface/${name}/feature/${idx - 1}`} className="btn !px-2 !py-1 !text-xs">
          ← {idx - 1}
        </Link>
      )}
      <Link to={`/surface/${name}/feature/${idx + 1}`} className="btn !px-2 !py-1 !text-xs">
        {idx + 1} →
      </Link>
    </div>
  )
}

function Stat({ label, value, sub, tip }) {
  return (
    <div className="card !p-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center">
        {label}
        {tip && <InfoIcon tip={tip} />}
      </div>
      <div className="text-base font-semibold text-slate-100 tabular-nums">{value ?? '—'}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5 truncate">{sub}</div>}
    </div>
  )
}

function EnrichCard({ lib, hit }) {
  const label = LIB_LABELS[lib] || lib
  const sig = hit.fdr != null && hit.fdr < 0.05
  return (
    <div className={`card ${sig ? 'border-emerald-500/40' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
        {sig && <span className="pill-green">sig</span>}
      </div>
      <div className="text-sm font-medium text-slate-100 leading-snug">{hit.term || '—'}</div>
      <div className="text-[10px] font-mono text-slate-500 mt-1">
        FDR {fmtSci(hit.fdr)} · overlap {hit.overlap || '—'}
      </div>
    </div>
  )
}

function NicheCard({ levelName, dm }) {
  const strong = dm.log2_enrichment != null && dm.log2_enrichment > 2
  const lvlNum = levelName.replace('level_', '')
  return (
    <Link
      to={dm.top_domain ? `/niches/${levelName}/${dm.top_domain}` : '#'}
      className={`card block transition ${strong ? 'border-brand-500/40 hover:border-brand-400' : 'hover:border-slate-600'}`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {levelName.replace('_', ' ')}
        </div>
        {strong && <span className="pill-blue">strong</span>}
      </div>
      {dm.top_domain_lb && (
        <div className="font-semibold text-slate-100 leading-tight mb-1">{dm.top_domain_lb}</div>
      )}
      <div className="font-mono text-xs text-slate-500">{dm.top_domain || '—'}</div>
      <div className="text-xs text-slate-400 mt-2">
        {dm.top_domain_frac != null ? (dm.top_domain_frac * 100).toFixed(1) : '—'}% of top cells
      </div>
      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
        log₂ enr {dm.log2_enrichment?.toFixed(2) ?? '—'} · FDR {fmtSci(dm.fdr)}
      </div>
    </Link>
  )
}

function fmt4(v) {
  if (v == null) return '—'
  return v.toFixed(4)
}

function fmtSci(x) {
  if (x == null || isNaN(x)) return '—'
  if (x === 0) return '0'
  const exp = Math.floor(Math.log10(x))
  const mant = x / Math.pow(10, exp)
  return `${mant.toFixed(1)}e${exp}`
}
