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
        // Auto-pick the slide with the most top cells for this feature
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
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
          Feature {idx} has no top cells with spatial coordinates.
        </div>
      </div>
    )
  }

  // Filter top cells to selected slide
  const slideTop = topCells.filter((t) => t.slide_idx === selectedSlide)

  return (
    <div>
      <Breadcrumb name={name} idx={idx} />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-900">
          Spatial projection · <span className="font-mono text-brand-700">feature {idx}</span>
        </h1>
        <Link
          to={`/surface/${name}/feature/${idx}`}
          className="px-3 py-1.5 rounded-md border border-slate-200 text-sm hover:bg-slate-100"
        >
          ← Back to feature
        </Link>
      </div>

      {/* Slide selector */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 mb-4">
        <label className="block text-xs font-medium text-slate-600 mb-2">
          Slide ({slideOptions.length} with top cells)
        </label>
        <select
          value={selectedSlide ?? ''}
          onChange={(e) => setSelectedSlide(Number(e.target.value))}
          className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm bg-white"
        >
          {slideOptions.map((s) => (
            <option key={s.idx} value={s.idx}>
              {s.tissue} / {s.name} ({slideCounts[s.idx]} top cells, {s.technology})
            </option>
          ))}
        </select>
      </div>

      {/* Plot */}
      {!bg ? (
        <Loading what="slide background" />
      ) : (
        <SpatialPlot bg={bg} top={slideTop} feature={feature} />
      )}
    </div>
  )
}

function Breadcrumb({ name, idx }) {
  return (
    <div className="text-xs text-slate-500 mb-2">
      <Link to="/" className="hover:underline">Surfaces</Link> /{' '}
      <Link to={`/surface/${name}`} className="hover:underline font-mono">{name}</Link> /{' '}
      <Link to={`/surface/${name}/feature/${idx}`} className="hover:underline font-mono">feature {idx}</Link> /{' '}
      <span>spatial</span>
    </div>
  )
}

function SpatialPlot({ bg, top, feature }) {
  // Background trace
  const traces = [
    {
      type: 'scattergl',
      mode: 'markers',
      x: bg.x,
      y: bg.y,
      marker: { size: 2, color: '#cbd5e1', opacity: 0.5 },
      name: `${bg.tissue} background (${bg.n_cells_subsampled.toLocaleString()} of ${bg.n_cells_total.toLocaleString()})`,
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
        colorbar: { title: '|activation|', thickness: 12, len: 0.6 },
        line: { width: 0.3, color: '#000' },
      },
      name: `feature ${feature.feature_idx} top cells`,
    },
  ]

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2">
      <Plot
        data={traces}
        layout={{
          autosize: true,
          height: 600,
          xaxis: { title: '', scaleanchor: 'y', showgrid: false, zeroline: false },
          yaxis: { title: '', showgrid: false, zeroline: false, autorange: 'reversed' },
          margin: { l: 30, r: 30, t: 20, b: 30 },
          showlegend: true,
          legend: { orientation: 'h', y: -0.05 },
          paper_bgcolor: 'white',
          plot_bgcolor: 'white',
        }}
        config={{ displayModeBar: true, displaylogo: false, responsive: true }}
        style={{ width: '100%' }}
      />
    </div>
  )
}
