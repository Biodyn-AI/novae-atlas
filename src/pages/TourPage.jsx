import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Plot from 'react-plotly.js'
import {
  getFeatureDetail,
  getFeatureSpatial,
  getSlideBackground,
  getSlides,
} from '../lib/data.js'
import { Loading } from '../components/Loading.jsx'

const FEATURE_IDX = 157
const SURFACE = 'aggregator'

export default function TourPage() {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-brand-500/10 text-brand-300 text-xs font-medium ring-1 ring-brand-500/30">
          2-minute tour
        </div>
        <h1 className="text-4xl font-bold text-slate-50 tracking-tight">
          How to use this atlas
        </h1>
        <p className="text-slate-400 mt-3 leading-relaxed">
          We'll trace one specific finding all the way through the atlas — feature 157, which
          Novae has internally learned to represent <strong className="text-slate-200">kidney distal tubule cells</strong>.
          By the end, you'll know exactly how to interrogate the atlas for any biology you care about.
        </p>
      </div>

      {/* Step 1 */}
      <Step n={1} title="Start with a question">
        <p>
          Suppose you're curious whether Novae knows about a specific cell type. Let's pick the{' '}
          <strong className="text-slate-100">renal distal tubule</strong> — a well-defined kidney
          anatomical compartment marked by{' '}
          <code className="bg-slate-800 px-1 py-0.5 rounded text-brand-300">AQP2</code> (the
          vasopressin-regulated water channel),{' '}
          <code className="bg-slate-800 px-1 py-0.5 rounded text-brand-300">GATA2</code>, and{' '}
          <code className="bg-slate-800 px-1 py-0.5 rounded text-brand-300">ELF5</code>.
        </p>
        <p className="text-slate-400 italic mt-2">
          Did Novae learn anything that looks like this — without ever being told about renal
          anatomy?
        </p>
      </Step>

      {/* Step 2 */}
      <Step n={2} title="Search by gene">
        <p>
          The atlas indexes <strong className="text-slate-100">30,206 genes</strong> that appear in the top-20 of at least one
          SAE feature. Type a gene name and you'll get the features that load most strongly on it.
        </p>
        <div className="mt-3">
          <Link to="/genes" className="btn-primary">
            Try the gene search → /genes
          </Link>
          <span className="text-xs text-slate-500 ml-3">
            Type <code className="bg-slate-800 px-1 py-0.5 rounded text-brand-300">AQP2</code>
          </span>
        </div>
      </Step>

      {/* Step 3 */}
      <Step n={3} title="Pick the strongest hit">
        <p>
          The top hit for <code className="bg-slate-800 px-1 py-0.5 rounded text-brand-300">AQP2</code>{' '}
          is <strong className="text-slate-100">feature 157</strong> in the aggregator surface, with
          a fold-change of <strong className="text-brand-300">21×</strong> over corpus baseline.
          Click into it to see the full drilldown.
        </p>
        <div className="mt-3">
          <Link to={`/surface/${SURFACE}/feature/${FEATURE_IDX}`} className="btn-primary">
            Open feature 157 →
          </Link>
        </div>
      </Step>

      {/* Step 4 */}
      <Step n={4} title="Confirm the cell type via gene markers + databases">
        <p>
          On the feature page, the headline label reads{' '}
          <strong className="text-slate-100">"Distal Tubule Cells"</strong>. This comes from PanglaoDB,
          an independent cell-type marker database — Novae was never trained on PanglaoDB, so this
          is a real cross-check, not circular reasoning.
        </p>
        <div className="mt-3 card !p-3 bg-slate-900/80 text-xs">
          <div className="text-slate-400">Top genes (fold-change ranked):</div>
          <div className="font-mono text-brand-300 mt-1">AQP2, CDH16, STC1, GATA2, ELF5</div>
          <div className="text-slate-500 mt-2">
            <strong className="text-slate-300">PanglaoDB:</strong> Distal Tubule Cells (FDR 2 × 10⁻⁸)
          </div>
          <div className="text-slate-500">
            <strong className="text-slate-300">GO BP:</strong> Glycerol Transmembrane Transport
          </div>
        </div>
        <p className="mt-3 text-slate-400">
          AQP2 is the textbook collecting-duct/distal-tubule water channel. GATA2 and ELF5 are
          renal epithelial transcription factors. Three independent signals (gene markers, cell-type
          database, GO term) all agree.
        </p>
      </Step>

      {/* Step 5 */}
      <Step n={5} title="Confirm via Novae's own niche assignment">
        <p>
          Now look at the <strong className="text-slate-100">Novae Niches</strong> panel. Niche{' '}
          <code className="bg-slate-800 px-1 py-0.5 rounded font-mono text-brand-300">D980</code>{' '}
          contains <strong className="text-slate-100">36% of this feature's top cells</strong>, with
          a log₂ enrichment of <strong className="text-brand-300">9.4</strong> — that's ≈ 700× more
          concentrated than baseline (FDR 8 × 10⁻¹⁶⁴).
        </p>
        <p className="mt-3 text-slate-400">
          This means Novae itself — independently of any external annotation — has carved out a
          specific spatial niche that this feature occupies. We now have <em>four</em> independent
          confirmations: gene markers, PanglaoDB, GO BP, and Novae's own SwAV-derived niche label.
        </p>
      </Step>

      {/* Step 6 */}
      <Step n={6} title="Confirm via space — does it light up the right place?">
        <p>
          Scroll down the feature page to the <strong className="text-slate-100">Spatial projection</strong>.
          The top cells (colored bright by activation magnitude) cluster tightly in the renal cortex
          distal tubule region — exactly where you'd expect them. A random or trivially-broken
          feature would scatter; a real anatomical feature localizes.
        </p>
        <p className="mt-3 text-slate-400">Live preview, exactly the same view as on the feature page:</p>
        <SpatialPreview surface={SURFACE} idx={FEATURE_IDX} />
      </Step>

      {/* What you just did */}
      <div className="card border-brand-500/40 mt-12">
        <div className="text-[10px] uppercase tracking-wider text-brand-300 font-bold mb-2">
          What you just did
        </div>
        <h2 className="text-xl font-bold text-slate-50 mb-3">
          You audited Novae for a specific piece of biological knowledge.
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          You went from a question (<em>"does the model know about distal tubule cells?"</em>) to a
          yes-or-no answer with <strong className="text-slate-100">four independent cross-checks</strong>{' '}
          (gene markers, PanglaoDB enrichment, GO BP, Novae's own niche assignment) and a{' '}
          <strong className="text-slate-100">visual confirmation</strong> on the actual tissue.
          This is the basic loop of using the atlas. Repeat it for any cell type, gene, or niche
          you care about.
        </p>
      </div>

      {/* Other entry points */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 mb-3">
          Other ways to enter the atlas
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <EntryCard
            href="/celltypes"
            title="Browse by cell type"
            description="178 PanglaoDB cell types as cards. Lets you discover what's in the atlas without knowing what to look for."
          />
          <EntryCard
            href="/niches"
            title="Browse by Novae niche"
            description="Hierarchical 7 / 12 / 92 niches with auto-derived labels. The niche-first view is unique to Novae — no analogue in single-cell atlases."
          />
          <EntryCard
            href="/genes"
            title="Search by gene"
            description="Same as Step 2 above. 30,206 indexed genes."
          />
          <EntryCard
            href="/surfaces"
            title="Browse by model surface"
            description="The 12 hooked layers and their stats. Useful for seeing how representations evolve through the GAT stack."
          />
          <EntryCard
            href="/stories"
            title="Read the curated stories"
            description="4 narratives explaining the most interesting findings."
          />
          <EntryCard
            href="/about"
            title="Glossary &amp; methodology"
            description="Definitions of every technical term, plus the full pipeline."
          />
        </div>
      </section>

      <div className="text-center mt-10">
        <Link to="/" className="btn">← Back to overview</Link>
      </div>
    </div>
  )
}

function Step({ n, title, children }) {
  return (
    <div className="relative pl-14 pb-10 border-l border-slate-800 ml-5">
      <div className="absolute -left-[1.4rem] top-0 w-10 h-10 rounded-full bg-slate-900 border-2 border-brand-500 flex items-center justify-center text-brand-300 font-bold">
        {n}
      </div>
      <h2 className="text-xl font-bold text-slate-100 mb-3 leading-tight">{title}</h2>
      <div className="text-sm text-slate-300 leading-relaxed space-y-2">{children}</div>
    </div>
  )
}

function EntryCard({ href, title, description }) {
  return (
    <Link to={href} className="card-hover block">
      <div className="font-semibold text-slate-100 mb-1">{title}</div>
      <div className="text-xs text-slate-400 leading-relaxed">{description}</div>
    </Link>
  )
}

function SpatialPreview({ surface, idx }) {
  const [topCells, setTopCells] = useState(null)
  const [bg, setBg] = useState(null)
  const [slideIdx, setSlideIdx] = useState(null)

  useEffect(() => {
    Promise.all([getFeatureSpatial(surface, idx), getSlides()])
      .then(([cells]) => {
        setTopCells(cells)
        const counts = {}
        for (const c of cells) counts[c.slide_idx] = (counts[c.slide_idx] || 0) + 1
        const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
        if (best) setSlideIdx(Number(best[0]))
      })
      .catch(console.error)
  }, [surface, idx])

  useEffect(() => {
    if (slideIdx == null) return
    getSlideBackground(slideIdx).then(setBg).catch(console.error)
  }, [slideIdx])

  if (!topCells || !bg) return <Loading what="spatial preview" />

  const slideTop = topCells.filter((t) => t.slide_idx === slideIdx)

  return (
    <div className="card !p-2 mt-3">
      <div className="pointer-events-none">
        <Plot
          data={[
            {
              type: 'scattergl',
              mode: 'markers',
              x: bg.x,
              y: bg.y,
              marker: { size: 1.6, color: '#334155', opacity: 0.6 },
              hoverinfo: 'skip',
              showlegend: false,
            },
            {
              type: 'scattergl',
              mode: 'markers',
              x: slideTop.map((t) => t.x),
              y: slideTop.map((t) => t.y),
              marker: {
                size: 6,
                color: slideTop.map((t) => Math.abs(t.a)),
                colorscale: 'Inferno',
                line: { width: 0.4, color: '#0f172a' },
              },
              hoverinfo: 'skip',
              showlegend: false,
            },
          ]}
          layout={{
            autosize: true,
            height: 380,
            paper_bgcolor: 'transparent',
            plot_bgcolor: '#020617',
            xaxis: { scaleanchor: 'y', showgrid: false, zeroline: false, showticklabels: false },
            yaxis: { showgrid: false, zeroline: false, autorange: 'reversed', showticklabels: false },
            margin: { l: 5, r: 5, t: 5, b: 5 },
            dragmode: false,
          }}
          config={{ displayModeBar: false, responsive: true, staticPlot: true, scrollZoom: false }}
          useResizeHandler
          style={{ width: '100%' }}
        />
      </div>
      <div className="text-[10px] text-slate-500 text-center pb-1">
        kidney slide · gray dots = background cells · colored dots = feature 157 top cells
      </div>
    </div>
  )
}
