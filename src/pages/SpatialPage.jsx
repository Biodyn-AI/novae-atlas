import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Plot from 'react-plotly.js'
import {
  getFeatureSpatial,
  getSlideBackground,
  getSlides,
  getFeatureDetail,
} from '../lib/data.js'
import { Loading, ErrorBox } from '../components/Loading.jsx'

export default function SpatialPage() {
  const { name, idx } = useParams()
  const [feature, setFeature] = useState(null)
  const [topCells, setTopCells] = useState(null)
  const [slides, setSlides] = useState(null)
  const [selectedSlide, setSelectedSlide] = useState(null)
  const [bg, setBg] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setFeature(null); setTopCells(null); setSelectedSlide(null); setBg(null); setError(null)
    Promise.all([
      getFeatureDetail(name, idx),
      getFeatureSpatial(name, idx),
      getSlides(),
    ])
      .then(([f, ts, sl]) => {
        setFeature(f)
        setTopCells(ts)
        setSlides(sl)
        const counts = {}
        for (const c of ts) counts[c.slide_idx] = (counts[c.slide_idx] || 0) + 1
        const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
        if (best) setSelectedSlide(Number(best[0]))
      })
      .catch(setError)
  }, [name, idx])

  useEffect(() => {
    if (selectedSlide == null) { setBg(null); return }
    setBg(null)
    getSlideBackground(selectedSlide).then(setBg).catch(setError)
  }, [selectedSlide])

  const slideCounts = useMemo(() => {
    if (!topCells) return {}
    const c = {}
    for (const t of topCells) c[t.slide_idx] = (c[t.slide_idx] || 0) + 1
    return c
  }, [topCells])

  const slideOptions = useMemo(() => {
    if (!slides || !slideCounts) return []
    return slides
      .filter((s) => slideCounts[s.idx])
      .sort((a, b) => (slideCounts[b.idx] || 0) - (slideCounts[a.idx] || 0))
  }, [slides, slideCounts])

  if (error) return <ErrorBox error={error} />
  if (!feature || !topCells || !slides) return <Loading what="spatial view" />

  if (topCells.length === 0) {
    return (
      <div>
        <Breadcrumb name={name} idx={idx} />
        <div className="card text-center text-slate-500">
          Feature {idx} has no top cells with spatial coordinates.
        </div>
      </div>
    )
  }

  const slideTop = topCells.filter((t) => t.slide_idx === selectedSlide)
  const selectedSlideMeta = slides.find((s) => s.idx === selectedSlide)

  return (
    <div>
      <Breadcrumb name={name} idx={idx} />

      <div className="flex items-end justify-between mb-4 gap-4 flex-wrap">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-1">
            spatial projection
          </div>
          <h1 className="text-3xl font-bold text-slate-50 leading-tight tracking-tight">
            {feature.lb || `feature ${idx}`}
          </h1>
          <div className="text-sm text-slate-500 mt-1">
            <span className="font-mono text-brand-300">{name}</span>
            <span className="mx-2 text-slate-700">·</span>
            <span className="font-mono">f{idx}</span>
          </div>
        </div>
        <Link to={`/surface/${name}/feature/${idx}`} className="btn">
          ← Back to feature
        </Link>
      </div>

      {/* WHAT IS THIS — explainer card */}
      <div className="card border-slate-700 mb-4">
        <details open>
          <summary className="cursor-pointer text-sm font-semibold text-slate-200 list-none flex items-center gap-2">
            <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            What does this projection mean?
            <span className="text-xs text-slate-500 ml-auto">click to collapse</span>
          </summary>
          <div className="mt-4 text-sm text-slate-400 leading-relaxed space-y-2">
            <p>
              This is a top-down view of an actual tissue slide from the Novae corpus. Every dot is
              a single cell at its real (x, y) coordinate on the slide.
            </p>
            <p className="flex items-start gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-slate-600 mt-1 shrink-0" />
              <span>
                <strong className="text-slate-200">Gray dots</strong> = a 5,000-cell random
                background sample of all cells on this slide. Provides the anatomical context.
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-orange-400 mt-1 shrink-0" style={{background: 'linear-gradient(90deg, #fcd34d, #f97316, #b91c1c)'}} />
              <span>
                <strong className="text-slate-200">Colored dots</strong> = the cells where this
                feature fires most strongly (the "top cells"). Color brightness encodes the
                activation magnitude — brighter = the feature fires harder on that cell.
              </span>
            </p>
            <p>
              <strong className="text-slate-200">How to read it:</strong> if the colored dots
              cluster tightly in a coherent anatomical region (a kidney distal tubule, a tonsillar
              follicle, a vascular bed), the feature represents a real spatial structure. If they
              scatter randomly across the slide, the feature isn't really spatial.
            </p>
            <p className="text-slate-500 text-xs">
              Use the dropdown to switch between slides where this feature has top cells. The slide
              with the most top cells is selected by default.
            </p>
          </div>
        </details>
      </div>

      {/* Slide selector */}
      <div className="card mb-4">
        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Slide
          <span className="text-slate-600 normal-case tracking-normal font-normal ml-2">
            ({slideOptions.length} slides have top cells from this feature)
          </span>
        </label>
        <select
          value={selectedSlide ?? ''}
          onChange={(e) => setSelectedSlide(Number(e.target.value))}
          className="input"
        >
          {slideOptions.map((s) => (
            <option key={s.idx} value={s.idx} className="bg-slate-900">
              {s.tissue} / {s.name} — {slideCounts[s.idx]} top cells ({s.technology})
            </option>
          ))}
        </select>
      </div>

      {/* Plot */}
      {!bg ? (
        <Loading what="slide background" />
      ) : (
        <SpatialPlot bg={bg} top={slideTop} feature={feature} slide={selectedSlideMeta} />
      )}
    </div>
  )
}

function Breadcrumb({ name, idx }) {
  return (
    <div className="text-xs text-slate-500 mb-2">
      <Link to="/surfaces" className="hover:text-brand-300">Surfaces</Link> /{' '}
      <Link to={`/surface/${name}`} className="hover:text-brand-300 font-mono">{name}</Link> /{' '}
      <Link to={`/surface/${name}/feature/${idx}`} className="hover:text-brand-300 font-mono">f{idx}</Link> /{' '}
      <span>spatial</span>
    </div>
  )
}

function SpatialPlot({ bg, top, feature, slide }) {
  const traces = [
    {
      type: 'scattergl',
      mode: 'markers',
      x: bg.x,
      y: bg.y,
      marker: { size: 2, color: '#475569', opacity: 0.55 },
      name: `${bg.tissue} background (${bg.n_cells_subsampled.toLocaleString()} of ${bg.n_cells_total.toLocaleString()} cells)`,
      hoverinfo: 'skip',
    },
    {
      type: 'scattergl',
      mode: 'markers',
      x: top.map((t) => t.x),
      y: top.map((t) => t.y),
      marker: {
        size: 7,
        color: top.map((t) => Math.abs(t.a)),
        colorscale: 'Inferno',
        showscale: true,
        colorbar: {
          title: { text: '|activation|', font: { color: '#cbd5e1', size: 11 } },
          thickness: 12,
          len: 0.6,
          tickfont: { color: '#94a3b8', size: 10 },
          outlinecolor: '#1e293b',
          bordercolor: '#1e293b',
        },
        line: { width: 0.4, color: '#0f172a' },
      },
      name: `feature ${feature.feature_idx} top cells (${top.length})`,
    },
  ]

  return (
    <div className="card !p-3">
      <Plot
        data={traces}
        layout={{
          autosize: true,
          height: 600,
          paper_bgcolor: 'transparent',
          plot_bgcolor: '#020617',
          font: { color: '#cbd5e1', family: 'Inter, sans-serif', size: 11 },
          xaxis: { title: '', scaleanchor: 'y', showgrid: false, zeroline: false, showticklabels: false, color: '#475569' },
          yaxis: { title: '', showgrid: false, zeroline: false, autorange: 'reversed', showticklabels: false, color: '#475569' },
          margin: { l: 20, r: 20, t: 20, b: 50 },
          showlegend: true,
          legend: { orientation: 'h', y: -0.05, font: { size: 10, color: '#cbd5e1' } },
        }}
        config={{
          displayModeBar: true,
          displaylogo: false,
          responsive: true,
          modeBarButtonsToRemove: ['lasso2d', 'select2d', 'toImage'],
        }}
        useResizeHandler
        style={{ width: '100%' }}
      />
      {slide && (
        <div className="text-[10px] text-slate-500 text-center pt-1">
          {slide.tissue} · {slide.name} · {slide.technology} · {slide.n_cells.toLocaleString()} total cells on this slide
        </div>
      )}
    </div>
  )
}
